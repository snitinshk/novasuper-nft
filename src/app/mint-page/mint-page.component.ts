import { Component, HostListener, OnInit, ChangeDetectorRef, Output, EventEmitter } from "@angular/core";
import { BackendApiService, BackendRoutes } from "../backend-api.service";
import { GlobalVarsService } from "../global-vars.service";
import { trigger, style, animate, transition } from "@angular/animations";
import { Router } from "@angular/router";
import { environment } from "../../environments/environment";
import * as tus from "tus-js-client";
import Timer = NodeJS.Timer;
import { CloudflareStreamService } from "../../lib/services/stream/cloudflare-stream-service";
import { BsModalService } from "ngx-bootstrap/modal";
import { CommentModalComponent } from "../comment-modal/comment-modal.component";
import { GoogleAnalyticsService } from "../google-analytics.service";

@Component({
  selector: "app-mint-page",
  templateUrl: "./mint-page.component.html",
  styleUrls: ["./mint-page.component.scss"],
  animations: [
    trigger("mintSwipeAnimation", [
      transition(":enter", [
        style({ transform: "translateX(100%)" }),
        animate("300ms linear", style({ transform: "translateX(0%)" })),
      ]),
      transition(":leave", [
        style({ transform: "translateX(0%)" }),
        animate("500ms ease", style({ transform: "translateX(-100%)" })),
      ]),
    ]),
    trigger("swipeAppearAnimation", [
      transition(":enter", [
        style({ transform: "translateX(100%)" }),
        animate("300ms linear", style({ transform: "translateX(0%)" })),
      ]),
      transition(":leave", [style({ opacity: "1" }), animate("200ms linear", style({ opacity: "0" }))]),
    ]),
    trigger("cardAppearAnimation", [
      transition(":enter", [style({ opacity: "0" }), animate("200ms linear", style({ opacity: "1" }))]),
      transition(":leave", [style({ opacity: "1" }), animate("200ms linear", style({ opacity: "0" }))]),
    ]),
  ],
})
export class MintPageComponent implements OnInit {
  @Output() postCreated = new EventEmitter();

  step = 1;
  mobile = false;
  submittingPost = false;
  postInput = "";
  postImageSrc = null;

  post: any;
  disableAnimation = true;

  postVideoSrc = null;
  videoUploadPercentage = null;

  showEmbedURL = false;
  showImageLink = false;
  embedURL = "";
  constructedEmbedURL: any;
  videoStreamInterval: Timer = null;
  readyToStream: boolean = false;

  postHashHex = "";
  isSubmitPress = false;

  isUploading = false;
  isUploaded = false;
  isUploadConfirmed = false;

  extrasOpen = false;
  arweaveClicked = false;
  // Step 1
  EDITION_OF_ONE = true;
  OPEN_AUCTION = true;
  // Step 2, excluding postimageSrc
  IMAGE: any;
  NAME_OF_PIECE: string;
  DESCRIPTION: string = "";
  CATEGORY: string = null;
  KEY: string;
  VALUE: string;
  KVMap = new Map();
  // Step 3
  MIN_PRICE: number;
  PRICE_USD: any;
  CREATOR_ROYALTY: number;
  COIN_ROYALTY: number;
  UNLOCKABLE_CONTENT = false;
  PUT_FOR_SALE = true;

  @HostListener("window:resize") onResize() {
    this.setMobileBasedOnViewport();
  }

  constructor(
    private analyticsService: GoogleAnalyticsService,
    private router: Router,
    private globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private streamService: CloudflareStreamService,
    private modalService: BsModalService,
    private changeRef: ChangeDetectorRef //private diaref: MatDialogRef<MintPageComponent>
  ) {}

  ngOnInit(): void {
    this.setMobileBasedOnViewport();
  }
  setMobileBasedOnViewport() {
    this.mobile = this.globalVars.isMobile();
  }
  _handleFilesInput(files: FileList): void {
    const fileToUpload = files.item(0);
    this._handleFileInput(fileToUpload);
  }
  _handleFileInput(file: File): void {
    if (!file) {
      return;
    }
    if (!file.type || (!file.type.startsWith("image/") && !file.type.startsWith("video/"))) {
      this.globalVars._alertError("File selected does not have an image or video file type.");
    } else if (file.type.startsWith("video/")) {
      this.uploadVideo(file);
    } else if (file.type.startsWith("image/")) {
      this.uploadImage(file);
    }
  }

  arweaveClick() {
    this.arweaveClicked = true;
  }
  uploadVideo(file: File): void {
    this.globalVars._alertError("Video has not been enabled...");
    return;

    if (file.size > 4 * (1024 * 1024 * 1024)) {
      this.globalVars._alertError("File is too large. Please choose a file less than 4GB");
      return;
    }
    let upload: tus.Upload;
    let mediaId = "";
    const comp: MintPageComponent = this;
    const options = {
      endpoint: this.backendApi._makeRequestURL(environment.uploadVideoHostname, BackendRoutes.RoutePathUploadVideo),
      chunkSize: 50 * 1024 * 1024, // Required a minimum chunk size of 5MB, here we use 50MB.
      uploadSize: file.size,
      onError: function (error) {
        comp.globalVars._alertError(error.message);
        upload.abort(true).then(() => {
          throw error;
        });
      },
      onProgress: function (bytesUploaded, bytesTotal) {
        comp.videoUploadPercentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
      },
      onSuccess: function () {
        // Construct the url for the video based on the videoId and use the iframe url.
        comp.postVideoSrc = `https://iframe.videodelivery.net/${mediaId}`;
        comp.postImageSrc = null;
        comp.videoUploadPercentage = null;
        comp.pollForReadyToStream();
      },
      onAfterResponse: function (req, res) {
        return new Promise((resolve) => {
          // The stream-media-id header is the video Id in Cloudflare's system that we'll need to locate the video for streaming.
          let mediaIdHeader = res.getHeader("stream-media-id");
          if (mediaIdHeader) {
            mediaId = mediaIdHeader;
          }
          resolve(res);
        });
      },
    };
    // Clear the interval used for polling cloudflare to check if a video is ready to stream.
    if (this.videoStreamInterval != null) {
      clearInterval(this.videoStreamInterval);
    }
    // Reset the postVideoSrc and readyToStream values.
    this.postVideoSrc = null;
    this.readyToStream = false;
    // Create and start the upload.
    upload = new tus.Upload(file, options);
    upload.start();
    return;
  }
  addKV() {
    this.KVMap.set(this.KEY.trim(), this.VALUE.trim());
    this.KEY = "";
    this.VALUE = "";
  }

  updateBidAmountUSD(desoAmount) {
    this.PRICE_USD = this.globalVars.nanosToUSDNumber(desoAmount * 1e9).toFixed(2);
    //this.setErrors();
  }

  uploadImage(file: File) {
    if (file.size > 15 * (1024 * 1024)) {
      this.globalVars._alertError("File is too large. Please choose a file less than 15MB");
      return;
    }
    this.isUploading = true;

    return this.backendApi
      .UploadImage(environment.uploadImageHostname, this.globalVars.loggedInUser.PublicKeyBase58Check, file)
      .subscribe(
        (res) => {
          this.postImageSrc = res.ImageURL;
          this.postVideoSrc = null;

          this.isUploading = false;
          this.isUploaded = this.postImageSrc.length > 0;
        },
        (err) => {
          this.globalVars._alertError(JSON.stringify(err.error.error));
          this.isUploading = false;
          this.isUploaded = false;
        }
      );
  }

  imageUploaded() {
    return this.postImageSrc?.length > 0;
  }

  hasUnreasonableRoyalties() {
    let isEitherUnreasonable =
      Number(this.CREATOR_ROYALTY) < 0 ||
      Number(this.CREATOR_ROYALTY) > 100 ||
      Number(this.COIN_ROYALTY) < 0 ||
      Number(this.COIN_ROYALTY) > 100;
    let isSumUnreasonable = Number(this.CREATOR_ROYALTY) + Number(this.COIN_ROYALTY) > 100;
    return isEitherUnreasonable || isSumUnreasonable;
  }
  uploadFile(event: any): void {
    this._handleFilesInput(event[0]);
  }
  hasUnreasonableMinBidAmount() {
    //return parseFloat(this.MIN_PRICE) < 0 || this.MIN_PRICE < 0;
    return this.MIN_PRICE < 0;
  }
  deleteKV(key) {
    this.KVMap.delete(key);
  }
  nextStep() {
    if (this.step + 1 < 5) {
      this.step++;
    }
  }
  previousStep() {
    if (this.step - 1 > 0) {
      this.step--;
    }
  }

  pollForReadyToStream(): void {
    let attempts = 0;
    let numTries = 1200;
    let timeoutMillis = 500;
    this.videoStreamInterval = setInterval(() => {
      if (attempts >= numTries) {
        clearInterval(this.videoStreamInterval);
        return;
      }
      this.streamService
        .checkVideoStatusByURL(this.postVideoSrc)
        .subscribe(([readyToStream, exitPolling]) => {
          if (readyToStream) {
            this.readyToStream = true;
            clearInterval(this.videoStreamInterval);
            return;
          }
          if (exitPolling) {
            clearInterval(this.videoStreamInterval);
            return;
          }
        })
        .add(() => attempts++);
    }, timeoutMillis);
  }

  isDescribed() {
    return this.DESCRIPTION?.length > 0 && this.DESCRIPTION?.length <= GlobalVarsService.MAX_POST_LENGTH;
  }
  isCategorized() {
    return this.CATEGORY?.length > 0;
  }
  isNamed() {
    return this.NAME_OF_PIECE?.length > 0 && this.NAME_OF_PIECE?.length <= 25;
  }
  isPriced() {
    return this.isPostMinPriceCorrect() && this.isPostRoyaltyCorrect();
  }

  isPostMinPriceCorrect() {
    return this.isNumber(this.MIN_PRICE) && this.MIN_PRICE >= 0;
  }

  isPostRoyaltyCorrect() {
    return (
      this.isPostCreatorRoyaltyCorrect() &&
      this.isPostHoldersRoyaltyCorrect() &&
      parseFloat(String(this.CREATOR_ROYALTY)) + parseFloat(String(this.COIN_ROYALTY)) <= 100
    );
  }
  hasImage() {
    return this.postImageSrc.length > 0;
  }
  isPostCreatorRoyaltyCorrect() {
    return this.isNumber(this.CREATOR_ROYALTY) && this.CREATOR_ROYALTY >= 0 && this.CREATOR_ROYALTY <= 100;
  }

  isPostHoldersRoyaltyCorrect() {
    return this.isNumber(this.COIN_ROYALTY) && this.COIN_ROYALTY >= 0 && this.COIN_ROYALTY <= 100;
  }
  hasKeyValue() {
    return this.KEY?.length > 0 && this.VALUE?.length > 0;
  }
  isNumber(n: string | number): boolean {
    return !isNaN(parseFloat(String(n))) && isFinite(Number(n));
  }

  isPostReady() {
    return (
      (this.isUploading || this.postImageSrc?.length > 0) &&
      this.postImageSrc.length > 0 &&
      this.isDescribed() &&
      this.isPriced()
    );
  }

  appendExtraData(TxnHashHex) {
    this.backendApi
      .AppendExtraData(this.globalVars.localNode, TxnHashHex, {
        jack: "jill",
        jim: "George",
      })
      .subscribe(
        (res) => {
          console.log("NICE");
        },
        (err) => {
          console.log("not nice");
        }
      );
  }

  mintNFT() {
    if (!this.MIN_PRICE) {
      this.MIN_PRICE = 0;
    }
    let creatorRoyaltyBasisPoints = 0;
    if (this.CREATOR_ROYALTY) {
      creatorRoyaltyBasisPoints = this.CREATOR_ROYALTY * 100;
    }

    let coinRoyaltyBasisPoints = 0;
    if (this.COIN_ROYALTY) {
      coinRoyaltyBasisPoints = this.COIN_ROYALTY * 100;
    }

    this.backendApi
      .CreateNft(
        this.globalVars.localNode,
        this.globalVars.loggedInUser?.PublicKeyBase58Check,
        this.postHashHex,
        1, // number of copies
        creatorRoyaltyBasisPoints,
        coinRoyaltyBasisPoints,
        this.UNLOCKABLE_CONTENT, // include unlockable
        this.PUT_FOR_SALE, // put on sale
        Math.trunc(this.MIN_PRICE * 1e9),
        this.globalVars.defaultFeeRateNanosPerKB
      )
      .subscribe(
        (res) => {
          this.dropNFT();
          this.globalVars.updateEverything(res.TxnHashHex, this.mintNFTSuccess, this.mintNFTFailure, this);
        },
        (err) => {
          this.globalVars._alertError(err.error.error);
          this.router.navigate(["/" + this.globalVars.RouteNames.POSTS + "/" + this.postHashHex]);
        }
      );
  }
  SendFailEvent() {
    this.analyticsService.eventEmitter("ATMF " + this.postHashHex, "engagement", "conversion", "click", 10);
  }
  // These two below are for adding straight to marketplace once minted, backend has been modified to fit this need
  dropNFT() {
    // Get the latest drop so that we can update it.
    this.backendApi
      .GetMarketplaceRefSupernovas(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        -1 /*DropNumber*/
      )
      .subscribe(
        (res: any) => {
          if (res.DropEntry.DropTstampNanos == 0) {
            this.SendFailEvent();
          }

          this.addNFTToLatestDrop(res.DropEntry, this.postHashHex);
        },
        (error) => {
          this.globalVars._alertError(error.error.error);
        }
      );
  }

  addNFTToLatestDrop(latestDrop: any, postHash: string) {
    this.backendApi
      .AddToMarketplaceSupernovas(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        latestDrop.DropNumber,
        latestDrop.DropTstampNanos,
        latestDrop.IsActive /*IsActive*/,
        postHash /*NFTHashHexToAdd*/,
        "" /*This is not actually needed it does nothing*/
      )
      .subscribe(
        (res: any) => {
          console.log("Added to marketplace!");
          this.SendMintedEvent();
        },
        (error) => {
          this.globalVars._alertError(error.error.error);
        }
      );
  }
  SendMintedEvent() {
    this.analyticsService.eventEmitter("nft_minted", "usage", "activity", "click", 10);
  }
  mintNFTSuccess(comp: MintPageComponent) {
    comp.nextStep();
  }

  seeNFT() {
    this.router.navigate(["/" + this.globalVars.RouteNames.NFT + "/" + this.postHashHex]);
  }

  mintNFTFailure(comp: MintPageComponent) {
    comp.globalVars._alertError("Your post has been created, but the minting failed. Please try again from the start.");
    comp.router.navigate(["/" + comp.globalVars.RouteNames.POSTS + "/" + comp.postHashHex]);
  }

  submitPost() {
    if (this.isSubmitPress) return;
    if (!this.isPostReady()) return;

    this.isSubmitPress = true;

    const bodyObj = {
      Body: this.DESCRIPTION,
      ImageURLs: [this.postImageSrc].filter((n) => n),
    };

    this.backendApi
      .SubmitPost(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        "",
        "",
        "" /*Title*/,
        bodyObj /*BodyObj*/,
        "",
        // PostExtraData
        {
          name: this.NAME_OF_PIECE,
          category: this.CATEGORY,
          properties: JSON.stringify(Array.from(this.KVMap)),
        },
        "",
        false /*IsHidden*/,
        this.globalVars.defaultFeeRateNanosPerKB /*MinFeeRateNanosPerKB*/
      )
      .subscribe(
        (response) => {
          this.globalVars.logEvent(`post : create`);
          this.postHashHex = response.PostEntryResponse.PostHashHex;
          this.post = response.PostEntryResponse;
          this.mintNFT();
        },
        (err) => {
          const parsedError = this.backendApi.parsePostError(err);
          this.globalVars._alertError(parsedError);
          this.globalVars.logEvent(`post : create : error`, { parsedError });
          this.isSubmitPress = false;
          this.changeRef.detectChanges();
        }
      );
  }

  _createPost() {
    // Check if the user has an account.
    if (!this.globalVars?.loggedInUser) {
      this.globalVars.logEvent("alert : post : account");
      //SharedDialogs.showCreateAccountToPostDialog(this.globalVars);
      return;
    }

    // Check if the user has a profile.
    if (!this.globalVars?.doesLoggedInUserHaveProfile()) {
      this.globalVars.logEvent("alert : post : profile");
      //SharedDialogs.showCreateProfileToPostDialog(this.router);
      return;
    }

    // Check if the user's profile is verified
    if (!this.globalVars.loggedInUser.ProfileEntryResponse?.IsVerified) {
      this.globalVars.logEvent("alert : post : no-verification");
      return;
    }

    this.submitPost();
  }
  mapToObj(m) {
    return Array.from(m).reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {});
  }

  openModal(event, isQuote = true) {
    // Prevent the post navigation click from occurring.
    event.stopPropagation();

    if (!this.globalVars.loggedInUser) {
      // Check if the user has an account.
      this.globalVars.logEvent("alert : reply : account");
      this.globalVars._alertError("Cannot Quote repost, create account to post...");
    } else if (!this.globalVars.doesLoggedInUserHaveProfile()) {
      // Check if the user has a profile.
      this.globalVars.logEvent("alert : reply : profile");
      this.globalVars._alertError("Cannot Quote repost, create profile to post...");
    } else {
      const initialState = {
        // If we are quoting a post, make sure we pass the content so we don't repost a repost.
        parentPost: this.post,
        afterCommentCreatedCallback: null,
        isQuote,
      };
      if (!this.post) {
        this.globalVars._alertError("Cannot Quote repost, create profile to post...");
        return;
      }
      // If the user has an account and a profile, open the modal so they can comment.
      this.modalService.show(CommentModalComponent, {
        class: "modal-dialog-centered",
        initialState,
      });
    }
  }
}
