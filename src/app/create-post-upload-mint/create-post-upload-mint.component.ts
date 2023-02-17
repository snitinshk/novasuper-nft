import { Component, OnInit, ChangeDetectorRef, Input, EventEmitter, Output, ViewChild } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { BackendApiService, PostEntryResponse } from "../backend-api.service";
import { Router, ActivatedRoute } from "@angular/router";
import { SharedDialogs } from "../../lib/shared-dialogs";
import { ArweaveJsService } from "../arweave-js.service";
import { MatDialogRef } from "@angular/material/dialog";

@Component({
  selector: "app-create-post-upload-mint",
  templateUrl: "./create-post-upload-mint.component.html",
  styleUrls: ["./create-post-upload-mint.component.scss"],
})
export class CreatePostUploadMintComponent implements OnInit {
  @Output() postCreated = new EventEmitter();

  globalVars: GlobalVarsService;
  GlobalVarsService = GlobalVarsService;

  isUploading = false;
  isUploaded = false;
  isUploadConfirmed = false;

  isSubmitPress = false;
  submittingPost = false;
  submittingPhase = 0;

  postImageSrc = "";
  postDescription = "";
  postMinPrice = null;
  postCreatorRoyalty = null;
  postHoldersRoyalty = null;
  postUnlockable = false;

  postHashHex = "";

  private arweave: ArweaveJsService;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private backendApi: BackendApiService,
    private changeRef: ChangeDetectorRef,
    private appData: GlobalVarsService,
    private diaref: MatDialogRef<CreatePostUploadMintComponent>
  ) {
    this.globalVars = appData;
    this.arweave = new ArweaveJsService(this.globalVars);
  }

  ngOnInit() {}

  mintNFT() {
    this.backendApi
      .CreateNft(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.postHashHex,
        1, // number of copies
        Math.trunc(parseFloat(String(this.postCreatorRoyalty)) * 100),
        Math.trunc(parseFloat(String(this.postHoldersRoyalty)) * 100),
        this.postUnlockable, // include unlockable
        true, // put on sale
        Math.trunc(parseFloat(String(this.postMinPrice)) * 1e9),
        this.globalVars.defaultFeeRateNanosPerKB
      )
      .subscribe(
        (res) => {
          this.globalVars.updateEverything(res.TxnHashHex, this.mintNFTSuccess, this.mintNFTFailure, this);
        },
        (err) => {
          this.globalVars._alertError(err.error.error);
          this.router.navigate(["/" + this.globalVars.RouteNames.POSTS + "/" + this.postHashHex]);
          this.diaref.close();
        }
      );
  }

  mintNFTSuccess(comp: CreatePostUploadMintComponent) {
    comp.router.navigate(["/" + comp.globalVars.RouteNames.NFT + "/" + comp.postHashHex]);
    comp.diaref.close();
  }

  mintNFTFailure(comp: CreatePostUploadMintComponent) {
    comp.globalVars._alertError("Your post has been created, but the minting failed. Please mint it manually.");
    comp.router.navigate(["/" + comp.globalVars.RouteNames.POSTS + "/" + comp.postHashHex]);
    comp.diaref.close();
  }

  submitPost() {
    if (this.isSubmitPress) return;
    if (!this.isPostReady()) return;

    this.isSubmitPress = true;

    const bodyObj = {
      Body: this.postDescription,
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
        {},
        "",
        false /*IsHidden*/,
        this.globalVars.defaultFeeRateNanosPerKB /*MinFeeRateNanosPerKB*/
      )
      .subscribe(
        (response) => {
          this.globalVars.logEvent(`post : create`);
          this.postHashHex = response.PostEntryResponse.PostHashHex;

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
      SharedDialogs.showCreateAccountToPostDialog(this.globalVars);
      return;
    }

    // Check if the user has a profile.
    if (!this.globalVars?.doesLoggedInUserHaveProfile()) {
      this.globalVars.logEvent("alert : post : profile");
      SharedDialogs.showCreateProfileToPostDialog(this.router);
      return;
    }

    // Check if the user's profile is verified
    if (!this.globalVars.loggedInUser.ProfileEntryResponse?.IsVerified) {
      this.globalVars.logEvent("alert : post : no-verification");
      console.log("Verification is required to use this dialog");
      return;
    }

    this.submitPost();
  }

  _handleFilesInput(files: FileList) {
    const fileToUpload = files.item(0);
    this.handleFileInput(fileToUpload);
  }

  handleFileInput(file: File) {
    if (false && !this.globalVars.loggedInUser.ProfileEntryResponse?.IsVerified) {
      this.globalVars._alertError("You need to be verified to upload images.");
      return;
    }

    if (!file.type || !file.type.startsWith("image/")) {
      this.globalVars._alertError("File selected does not have an image file type.");
      return;
    }
    if (file.size > 1024 * 1024 * 1024) {
      this.globalVars._alertError("File is too large. Please choose a file of a size less than 200KB");
      return;
    }

    this.isUploading = true;

    this.arweave.UploadImage(file).subscribe(
      (res) => {
        let url = "https://arweave.net/" + res;
        this.postImageSrc = url;
        this.isUploading = false;
        this.isUploaded = this.postImageSrc.length > 0;
        this.arweave.ConfirmTransaction(res).subscribe(
          (res) => {
            this.isUploadConfirmed = res;
          },
          (err) => {
            this.isUploadConfirmed = false;
          }
        );
      },
      (err) => {
        this.isUploading = false;
        this.isUploaded = false;
        this.globalVars._alertError("Failed to upload image to arweave: " + err.message);
      }
    );
  }

  isPostReady() {
    return (
      (this.isUploading || this.isUploaded) && this.postImageSrc.length > 0 && this.isDescribed() && this.isPriced()
    );
  }

  isDescribed() {
    return this.postDescription.length > 0 && this.postDescription.length <= GlobalVarsService.MAX_POST_LENGTH;
  }

  isPriced() {
    return this.isPostMinPriceCorrect() && this.isPostRoyaltyCorrect();
  }

  isPostMinPriceCorrect() {
    return this.isNumber(this.postMinPrice) && this.postMinPrice >= 0;
  }

  isPostRoyaltyCorrect() {
    return (
      this.isPostCreatorRoyaltyCorrect() &&
      this.isPostHoldersRoyaltyCorrect() &&
      parseFloat(String(this.postCreatorRoyalty)) + parseFloat(String(this.postHoldersRoyalty)) <= 100
    );
  }

  isPostCreatorRoyaltyCorrect() {
    return this.isNumber(this.postCreatorRoyalty) && this.postCreatorRoyalty >= 0 && this.postCreatorRoyalty <= 100;
  }

  isPostHoldersRoyaltyCorrect() {
    return this.isNumber(this.postHoldersRoyalty) && this.postHoldersRoyalty >= 0 && this.postHoldersRoyalty <= 100;
  }

  isNumber(n: string | number): boolean {
    return !isNaN(parseFloat(String(n))) && isFinite(Number(n));
  }
}
