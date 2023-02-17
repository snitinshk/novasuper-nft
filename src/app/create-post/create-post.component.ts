import { Component, OnInit, ChangeDetectorRef, Input, EventEmitter, Output, ViewChild } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { BackendApiService, PostEntryResponse } from "../backend-api.service";
import { Router, ActivatedRoute } from "@angular/router";
import { SharedDialogs } from "../../lib/shared-dialogs";
import { CdkTextareaAutosize } from "@angular/cdk/text-field";
import { EmbedUrlParserService } from "../../lib/services/embed-url-parser-service/embed-url-parser-service";
import { environment } from "../../environments/environment";
import { MatDialogRef } from "@angular/material/dialog";

@Component({
  selector: "app-create-post",
  templateUrl: "./create-post.component.html",
  styleUrls: ["./create-post.component.scss"],
})
export class CreatePostComponent implements OnInit {
  static SHOW_POST_LENGTH_WARNING_THRESHOLD = 260; // show warning at 260 characters

  EmbedUrlParserService = EmbedUrlParserService;

  @Input() postRefreshFunc: any = null;
  @Input() numberOfRowsInTextArea: number = 2;
  @Input() parentPost: PostEntryResponse = null;
  @Input() isQuote: boolean = false;

  isComment: boolean;

  @ViewChild("autosize") autosize: CdkTextareaAutosize;

  randomMovieQuote = "";
  randomMovieQuotes = [
    "I love it when a plan comes together.",
    "Hang on everybody, let's try something!",
    "We code because we say we code!",
    "Of course we have a plan. To the Moon!",
    "Grab a Captain Bellybuster cap!",
    "Are we decentralized enough?",
    "Making plans? Reality check incoming!",
    "I want frickin' sharks with laser beams!",
    "Run! They are after my lucky charms!",
    "Don't repeat yourself. Move on!",
    "Keep it as simple as possible.",
    "If it ain't broke, don't fix it!",
    "Don't fear missing out. You create it!",
    "Adapt, try again, and keep adapting.",
    "Working hard? Don't miss out on life.",
    "If you ship it, they will come.",
    "Do you all have the BitClout song playing?",
    "A good deed is best served cold.",
    "Wow, this looks exactly like CoD right?",
    "Be one step ahead, don't run away!",
    "Make in a week what others make in a year.",
    "We believe in you, even if you don't.",
    "When will the chaos start to work for you?",
    "Focus on the happy path & don't look back.",
    "Make sure that time is on your side.",
    "Waiting to start? Please step aside.",
    "Teamwork is what makes the team work!",
    "Closed source is like a closed heart. Lonely.",
    "Lead, follow, or stay on board of the rocket.",
    "Who's making all the stars shine so bright?",
    "Turn the light on! I'm entering the stage!",
    "Turn the lights off, I'm starting to code!",
    "Wake up, you are the chosen one...",
    "Open your eyes and follow the white rabbit.",
    "Can we have a world of our own? No nonsense?",
    "Who in the world are you? Who am I?",
    "How long is forever? Is it longer then now?",
    "Nothing's impassible! Let's 🚀",
    "What once was, still is - doesn't have to be.",
    "Its the direction that matters, not the goal!",
    "It is such a magical place, the land of joy.",
    "One loves the sunrise when everybody is happy.",
    "Lets get these electrons jomping and romping!",
    "Is this an atomic and nuclear misticism?",
    "We don't do drugs. We are the drug.",
    "Don't fear perfect. It's never so. Just do!",
    "Everything alters me, but I keep growing.",
    "Its either easy or impossible. Do both.",
    "Online time is too short to remain unnoticed.",
    "God made a human, and human made the BitClout.",
    "Everything that is contradictory creates hype.",
    "Start gazing. Start thinking. Start doing.",
    "Am I so brief, or have I already finished?",
    "Liking money is nothing less than mysticism.",
    "So little of what will happen does happen.",
    "Say, are we a groovy, happenin' bunch?",
    "Fly by night, laugh, and shout: BitCloooout!",
    "Let's build the catatonic choo-choo!",
    "Fasten your seatbelts! GodSpeed!",
    "Ain't nothing wrong with being practical.",
  ];

  submittingPost = false;
  postInput = "";
  postImageSrc = null;

  showEmbedURL = false;
  showImageLink = false;
  embedURL = "";
  constructedEmbedURL: any;
  // Emits a PostEntryResponse. It would be better if this were typed.
  @Output() postCreated = new EventEmitter();

  globalVars: GlobalVarsService;
  GlobalVarsService = GlobalVarsService;
  isSubmitPress: boolean = false;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private backendApi: BackendApiService,
    private changeRef: ChangeDetectorRef,
    private appData: GlobalVarsService,
    private diaref: MatDialogRef<CreatePostComponent>
  ) {
    this.globalVars = appData;
  }

  ngOnInit() {
    this.isComment = !this.isQuote && !!this.parentPost;
    this._setRandomMovieQuote();
  }

  onPaste(event: any): void {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    let blob = null;

    for (const item of items) {
      if (item.type.indexOf("image") === 0) {
        blob = item.getAsFile();
      }
    }

    if (blob) {
      this._handleFileInput(blob);
    }
  }

  uploadFile(event: any): void {
    if (!this.isComment) {
      this._handleFileInput(event[0]);
    }
  }

  showCharacterCountIsFine() {
    return this.postInput.length < CreatePostComponent.SHOW_POST_LENGTH_WARNING_THRESHOLD;
  }

  showCharacterCountWarning() {
    return (
      this.postInput.length >= CreatePostComponent.SHOW_POST_LENGTH_WARNING_THRESHOLD &&
      this.postInput.length <= GlobalVarsService.MAX_POST_LENGTH
    );
  }

  characterCountExceedsMaxLength() {
    return this.postInput.length > GlobalVarsService.MAX_POST_LENGTH;
  }

  getPlaceholderText() {
    // Creating vanilla post
    if (!this.parentPost) {
      return this.randomMovieQuote;
    }
    // Creating comment or quote reclout;
    return this.isQuote ? "Add a quote" : "Post your reply";
  }

  _setRandomMovieQuote() {
    const randomInt = Math.floor(Math.random() * this.randomMovieQuotes.length);
    this.randomMovieQuote = this.randomMovieQuotes[randomInt];
  }

  setEmbedURL() {
    EmbedUrlParserService.getEmbedURL(this.backendApi, this.globalVars, this.embedURL).subscribe(
      (res) => (this.constructedEmbedURL = res)
    );
  }

  submitPost() {
    this.isSubmitPress = true;
    if (this.postInput.length > GlobalVarsService.MAX_POST_LENGTH) {
      return;
    }

    // post can't be blank
    if (this.postInput.length === 0 && !this.postImageSrc) {
      return;
    }

    if (this.submittingPost) {
      return;
    }

    const postExtraData = {};
    if (this.embedURL) {
      if (EmbedUrlParserService.isValidEmbedURL(this.constructedEmbedURL)) {
        postExtraData["EmbedVideoURL"] = this.constructedEmbedURL;
      }
    }

    const bodyObj = {
      Body: this.postInput,
      // Only submit images if the post is a quoted reclout or a vanilla post.
      ImageURLs: !this.isComment ? [this.postImageSrc].filter((n) => n) : [],
    };
    const repostedPostHashHex = this.isQuote ? this.parentPost.PostHashHex : "";
    this.submittingPost = true;
    const postType = this.isQuote ? "quote" : this.isComment ? "reply" : "create";

    this.backendApi
      .SubmitPost(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        "" /*PostHashHexToModify*/,
        this.isComment ? this.parentPost.PostHashHex : "" /*ParentPostHashHex*/,
        "" /*Title*/,
        bodyObj /*BodyObj*/,
        repostedPostHashHex,
        postExtraData,
        "" /*Sub*/,
        // TODO: Should we have different values for creator basis points and stake multiple?
        // TODO: Also, it may not be reasonable to allow stake multiple to be set in the FE.
        false /*IsHidden*/,
        this.globalVars.defaultFeeRateNanosPerKB /*MinFeeRateNanosPerKB*/
      )
      .subscribe(
        (response) => {
          this.globalVars.logEvent(`post : ${postType}`);

          this.submittingPost = false;

          this.postInput = "";
          this.postImageSrc = null;
          this.embedURL = "";
          this.constructedEmbedURL = "";
          this.changeRef.detectChanges();

          // Refresh the post page.
          if (this.postRefreshFunc) {
            this.postRefreshFunc(response.PostEntryResponse);
          }

          this.postCreated.emit(response.PostEntryResponse);
          this.isSubmitPress = false;
          this.diaref.close();
        },
        (err) => {
          const parsedError = this.backendApi.parsePostError(err);
          this.globalVars._alertError(parsedError);
          this.globalVars.logEvent(`post : ${postType} : error`, { parsedError });
          this.isSubmitPress = false;
          this.submittingPost = false;
          this.changeRef.detectChanges();
        }
      );
  }

  _createPost() {
    // Check if the user has an account.
    if (!this.globalVars?.loggedInUser) {
      this.globalVars.logEvent("alert : post : account");
      SharedDialogs.showCreateAccountToPostDialog(this.globalVars);
      return;
    }

    // Check if the user has a profile.
    if (!this.globalVars?.doesLoggedInUserHaveProfile()) {
      this.globalVars.logEvent("alert : post : profile");
      SharedDialogs.showCreateProfileToPostDialog(this.router);
      return;
    }

    // The user has an account and a profile. Let's create a post.
    this.submitPost();
  }

  _handleFilesInput(files: FileList) {
    this.showImageLink = false;
    const fileToUpload = files.item(0);
    this._handleFileInput(fileToUpload);
  }

  _handleFileInput(file: File) {
    if (!file.type || !file.type.startsWith("image/")) {
      this.globalVars._alertError("File selected does not have an image file type.");
      return;
    }
    if (file.size > 15 * (1024 * 1024)) {
      this.globalVars._alertError("File is too large. Please choose a file less than 15MB");
      return;
    }
    this.backendApi
      .UploadImage(environment.uploadImageHostname, this.globalVars.loggedInUser.PublicKeyBase58Check, file)
      .subscribe(
        (res) => {
          this.postImageSrc = res.ImageURL;
        },
        (err) => {
          this.globalVars._alertError(JSON.stringify(err.error.error));
        }
      );
  }
}
