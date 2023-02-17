import { Component, OnInit, Input, OnChanges } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { ActivatedRoute, Router } from "@angular/router";
import { BackendApiService, TutorialStatus } from "../../backend-api.service";
import { SwalHelper } from "../../../lib/helpers/swal-helper";
import { AppRoutingModule, RouteNames } from "../../app-routing.module";
import { Title } from "@angular/platform-browser";
import { environment } from "src/environments/environment";
import { AngularFireStorage, AngularFireStorageReference, AngularFireUploadTask } from "@angular/fire/storage";
import { AngularFirestore } from "@angular/fire/firestore";
import { Observable } from "rxjs";

export type ProfileUpdates = {
  usernameUpdate: string;
  descriptionUpdate: string;
  profilePicUpdate: string;
};

export type ProfileUpdateErrors = {
  usernameError: boolean;
  descriptionError: boolean;
  profilePicError: boolean;
  founderRewardError: boolean;
};

@Component({
  selector: "update-profile",
  templateUrl: "./update-profile.component.html",
  styleUrls: ["./update-profile.component.scss"],
})
export class UpdateProfileComponent implements OnInit, OnChanges {
  @Input() loggedInUser: any;
  @Input() inTutorial: boolean = false;

  // Firebase
  ref: AngularFireStorageReference;
  task: AngularFireUploadTask;

  // Email
  emailAddress = "";
  loading = false;
  invalidEmailEntered = false;
  updatingSettings = false;
  showSuccessMessage = false;
  successMessageTimeout: any;

  profilePicturePromtOpen = false;

  // Expanding menus
  contactsOpen = false;
  socialsOpen = false;
  verificationOpen = false;
  // Used for storing firebase response
  profileData: any;
  // Used for storing input value changes
  twitter: string;
  discord: string;
  website: string;
  instagram: string;
  name: string;
  photoLocation: string = "";

  updateProfileBeingCalled: boolean = false;
  usernameInput: string;
  descriptionInput: string;
  profilePicInput: string;
  founderRewardInput: number = 100;
  loggedInUserPublicKey = "";
  profileCardUrl: any = "";
  uploadProgress: Observable<number>;
  profileUpdates: ProfileUpdates = {
    usernameUpdate: "",
    descriptionUpdate: "",
    profilePicUpdate: "",
  };
  profileUpdateErrors: ProfileUpdateErrors = {
    usernameError: false,
    descriptionError: false,
    profilePicError: false,
    founderRewardError: false,
  };
  profileUpdated = false;

  constructor(
    public globalVars: GlobalVarsService,
    private firestore: AngularFirestore,
    private afStorage: AngularFireStorage,
    private route: ActivatedRoute,
    private backendApi: BackendApiService,
    private router: Router,
    private titleService: Title
  ) {}

  ngOnInit() {
    this._updateFormBasedOnLoggedInUser();
    this.titleService.setTitle(`Update Profile - ${environment.node.name}`);
    this.getOnlyProfileSocials();
    this.loadBannerImage();
    this._getUserMetadata();
  }

  _getUserMetadata() {
    this.loading = true;
    this.backendApi
      .GetUserGlobalMetadata(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check /*UpdaterPublicKeyBase58Check*/
      )
      .subscribe(
        (res) => {
          this.emailAddress = res.Email;
        },
        (err) => {
          console.log(err);
        }
      )
      .add(() => {
        this.loading = false;
      });
  }

  _validateEmail(email) {
    if (email === "" || this.globalVars.emailRegExp.test(email)) {
      this.invalidEmailEntered = false;
    } else {
      this.invalidEmailEntered = true;
    }
  }

  _updateEmail() {
    if (this.showSuccessMessage) {
      this.showSuccessMessage = false;
      clearTimeout(this.successMessageTimeout);
    }

    this.updatingSettings = true;
    this.backendApi
      .UpdateUserGlobalMetadata(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check /*UpdaterPublicKeyBase58Check*/,
        this.emailAddress /*EmailAddress*/,
        null /*MessageReadStateUpdatesByContact*/
      )
      .subscribe(
        (res) => {},
        (err) => {
          this.globalVars._alertError("Error updating email...", err);
        }
      )
      .add(() => {
        this.showSuccessMessage = true;
        this.updatingSettings = false;
        this.successMessageTimeout = setTimeout(() => {
          this.showSuccessMessage = false;
        }, 500);
      });
  }
  // This is used to handle any changes to the loggedInUser elegantly.
  ngOnChanges(changes: any) {
    if (changes.loggedInUser) {
      // If there is no previousValue, we have just gotten the user so do an update.
      if (!changes.loggedInUser.previousValue) {
        this._updateFormBasedOnLoggedInUser();
      }
      // If there is a previousValue and it was a different user, update the form.
      else if (
        changes.loggedInUser.previousValue.PublicKeyBase58Check !=
        changes.loggedInUser.currentValue.PublicKeyBase58Check
      ) {
        this._updateFormBasedOnLoggedInUser();
      }
    }
  }
  toggleProfilePicturePrompt() {
    this.profilePicturePromtOpen = !this.profilePicturePromtOpen;
  }
  founderRewardTooltip() {
    return (
      "When someone purchases your coin, a percentage of that " +
      "gets allocated to you as a founder reward.\n\n" +
      "A value of 0% means you get no money when someone buys, " +
      "whereas a value of 100% means that nobody other than you can ever get coins because 100% of " +
      "every purchase will just go to you.\n\n" +
      "Setting this value too high will deter buyers from ever " +
      "purchasing your coin. It's a balance, so be careful or just stick " +
      "with the default."
    );
  }

  _updateFormBasedOnLoggedInUser() {
    if (this.globalVars.loggedInUser) {
      const profileEntryResponse = this.globalVars.loggedInUser.ProfileEntryResponse;
      this.usernameInput = profileEntryResponse?.Username || "";
      this.descriptionInput = profileEntryResponse?.Description || "";
      if (profileEntryResponse) {
        this.backendApi
          .GetSingleProfilePicture(
            this.globalVars.localNode,
            profileEntryResponse?.PublicKeyBase58Check,
            this.globalVars.profileUpdateTimestamp ? `?${this.globalVars.profileUpdateTimestamp}` : ""
          )
          .subscribe((res) => {
            this._readImageFileToProfilePicInput(res);
          });
      }

      // If they don't have CreatorBasisPoints set, use the default.
      if (this.globalVars.loggedInUser.ProfileEntryResponse?.CoinEntry?.CreatorBasisPoints != null) {
        this.founderRewardInput = this.globalVars.loggedInUser.ProfileEntryResponse.CoinEntry.CreatorBasisPoints / 100;
      }
    }
  }

  _setProfileUpdates() {
    const profileEntryResponse = this.globalVars.loggedInUser.ProfileEntryResponse;
    this.profileUpdates.usernameUpdate =
      profileEntryResponse?.Username !== this.usernameInput ? this.usernameInput : "";
    this.profileUpdates.descriptionUpdate =
      profileEntryResponse?.Description !== this.descriptionInput ? this.descriptionInput : "";
    this.profileUpdates.profilePicUpdate =
      profileEntryResponse?.ProfilePic !== this.profilePicInput ? this.profilePicInput : "";
  }

  _setProfileErrors(): boolean {
    let hasErrors = false;
    if (this.usernameInput.length == 0) {
      this.profileUpdateErrors.usernameError = true;
      hasErrors = true;
    } else {
      this.profileUpdateErrors.usernameError = false;
    }

    if (this.descriptionInput.length > 512) {
      this.profileUpdateErrors.descriptionError = true;
      hasErrors = true;
    } else {
      this.profileUpdateErrors.descriptionError = false;
    }

    if (
      this.profilePicInput == null ||
      this.profilePicInput.length == 0 ||
      this.profilePicInput.length > 5 * 1024 * 1024 //
    ) {
      this.profileUpdateErrors.profilePicError = true;
      hasErrors = true;
    } else {
      this.profileUpdateErrors.profilePicError = false;
    }

    if (typeof this.founderRewardInput != "number" || this.founderRewardInput < 0 || this.founderRewardInput > 100) {
      this.profileUpdateErrors.founderRewardError = true;
      hasErrors = true;
    } else {
      this.profileUpdateErrors.founderRewardError = false;
    }

    return hasErrors;
  }

  // TODO: Kill NewStakeMultipleBasisPoints as an input to this endpoint in the backend.
  // TODO: Kill password as an input to this endpoint in the backend.
  //
  // This is a standalone function in case we decide we want to confirm fees before doing a real transaction.
  _callBackendUpdateProfile() {
    return this.backendApi.UpdateProfile(
      this.globalVars.localNode,
      this.globalVars.loggedInUser.PublicKeyBase58Check /*UpdaterPublicKeyBase58Check*/,
      "" /*ProfilePublicKeyBase58Check*/,
      // Start params
      this.profileUpdates.usernameUpdate /*NewUsername*/,
      this.profileUpdates.descriptionUpdate /*NewDescription*/,
      this.profileUpdates.profilePicUpdate /*NewProfilePic*/,
      this.founderRewardInput * 100 /*NewCreatorBasisPoints*/,
      1.25 * 100 * 100 /*NewStakeMultipleBasisPoints*/,
      false /*IsHidden*/,
      // End params
      this.globalVars.feeRateDeSoPerKB * 1e9 /*MinFeeRateNanosPerKB*/
    );
  }

  _updateProfile() {
    // Trim the username input in case the user added a space at the end. Some mobile
    // browsers may do this.
    this.usernameInput = this.usernameInput.trim();

    // update socials
    this.updateSocials();

    // update Email
    if (!this.invalidEmailEntered && this.emailAddress != "") {
      this._updateEmail();
    }

    const hasErrors = this._setProfileErrors();
    if (hasErrors) {
      this.globalVars.logEvent("profile : update : has-errors", this.profileUpdateErrors);
      return;
    }

    this.updateProfileBeingCalled = true;
    this._setProfileUpdates();
    this._callBackendUpdateProfile().subscribe(
      (res) => {
        this.globalVars.profileUpdateTimestamp = Date.now();
        this.globalVars.logEvent("profile : update");
        // This updates things like the username that shows up in the dropdown.
        this.globalVars.updateEverything(res.TxnHashHex, this._updateProfileSuccess, this._updateProfileFailure, this);
      },
      (err) => {
        const parsedError = this.backendApi.parseProfileError(err);
        const lowBalance = parsedError.indexOf("insufficient");
        this.globalVars.logEvent("profile : update : error", { parsedError, lowBalance });
        this.updateProfileBeingCalled = false;
        SwalHelper.fire({
          target: this.globalVars.getTargetComponentSelector(),
          icon: "error",
          title: `An Error Occurred`,
          html: parsedError,
          showConfirmButton: true,
          focusConfirm: true,
          customClass: {
            confirmButton: "btn btn-light",
            cancelButton: "btn btn-light no",
          },
          confirmButtonText: lowBalance ? "Buy $DESO" : null,
          cancelButtonText: lowBalance ? "Later" : null,
          showCancelButton: !!lowBalance,
        }).then((res) => {
          if (lowBalance && res.isConfirmed) {
            this.router.navigate([RouteNames.BUY_DESO], { queryParamsHandling: "merge" });
          }
        });
      }
    );
  }

  _updateProfileSuccess(comp: UpdateProfileComponent) {
    comp.globalVars.celebrate();
    comp.updateProfileBeingCalled = false;
    comp.profileUpdated = true;
    if (comp.inTutorial) {
      comp.router.navigate([RouteNames.TUTORIAL, RouteNames.INVEST, RouteNames.BUY_CREATOR], {
        queryParamsHandling: "merge",
      });
      return;
    }
    if (comp.globalVars.loggedInUser.UsersWhoHODLYouCount === 0) {
      SwalHelper.fire({
        target: comp.globalVars.getTargetComponentSelector(),
        title: "You’re all set!",
        showConfirmButton: true,
        focusConfirm: true,
        customClass: {
          confirmButton: "creator-coin-button",
        },
        text: `Your profile has been updated.`,
        confirmButtonText: "Go to my profile",
      }).then((res) => {
        if (res.isConfirmed) {
          comp.router.navigate([
            AppRoutingModule.profilePath(comp.globalVars.loggedInUser.ProfileEntryResponse.Username),
          ]);
        }
      });
    }
  }

  _updateProfileFailure(comp: UpdateProfileComponent) {
    comp.globalVars._alertError("Transaction broadcast successfully but read node timeout exceeded. Please refresh.");
    comp.updateProfileBeingCalled = false;
  }

  _handleFileInput(files: FileList) {
    let fileToUpload = files.item(0);
    if (!fileToUpload.type || !fileToUpload.type.startsWith("image/")) {
      this.globalVars._alertError("File selected does not have an image file type.");
      return;
    }
    if (fileToUpload.size > 5 * 1024 * 1024) {
      this.globalVars._alertError("Please upload an image that is smaller than 5MB.");
      return;
    }
    this._readImageFileToProfilePicInput(fileToUpload);
  }

  _uploadBannerImage(files: FileList) {
    let fileToUpload = files.item(0);
    if (!fileToUpload.type || !fileToUpload.type.startsWith("image/")) {
      this.globalVars._alertError("File selected does not have an image file type.");
      return;
    }
    if (fileToUpload.size > 5 * 1024 * 1024) {
      this.globalVars._alertError("Please upload an image that is smaller than 5MB.");
      return;
    }
    // Make banner image the default image
    document.getElementById("banner-image").setAttribute("src", "./assets/img/default-cover.png");

    //this.photoLocation = (Math.random() + 1).toString(36).substring(7);

    // Here store the image itself
    this.ref = this.afStorage.ref(this.globalVars.loggedInUser?.PublicKeyBase58Check);
    this.task = this.ref.put(fileToUpload);

    // This is for cache busting, but idk if it even works
    setTimeout(() => {
      this.loadBannerImage();
    }, 2500);
  }
  getOnlyProfileSocials() {
    return this.firestore
      .collection("profile-details")
      .doc(this.globalVars.loggedInUser?.PublicKeyBase58Check)
      .valueChanges()
      .subscribe((res) => (this.profileData = res));
  }
  async loadBannerImage() {
    try {
      this.afStorage
        .ref(this.loggedInUser?.PublicKeyBase58Check)
        .getDownloadURL()
        .subscribe(function (url) {
          url = url.replace(
            "https://firebasestorage.googleapis.com",
            "https://ik.imagekit.io/s93qwyistj0/banner-image/tr:w-915,h-250"
          );
          document.getElementById("banner-image").setAttribute("src", url);
          this.profileCardUrl = url;
        });
    } catch (error) {
      console.log("Error");
    }
  }

  async getProfileSocials() {
    return this.firestore
      .collection("profile-details")
      .doc(this.loggedInUser?.PublicKeyBase58Check)
      .valueChanges()
      .subscribe((res) =>
        this.afStorage
          .ref(this.loggedInUser?.PublicKeyBase58Check)
          .child(res["photoLocation"])
          .getDownloadURL()
          .toPromise()
          .then((res) => (this.profileCardUrl = res))
          .catch((err) => console.log(err))
      );
  }
  _readImageFileToProfilePicInput(file: Blob | File) {
    const reader = new FileReader();
    reader.readAsBinaryString(file);
    reader.onload = (event: any) => {
      const base64Image = btoa(event.target.result);
      this.profilePicInput = `data:${file.type};base64,${base64Image}`;
    };
  }

  updateSocials() {
    if (this.profileData) {
      return new Promise<any>((resolve, reject) => {
        this.firestore
          .collection("profile-details")
          .doc(this.globalVars.loggedInUser?.PublicKeyBase58Check)
          .set({
            twitter: typeof this.twitter === "undefined" ? this.profileData.twitter : this.twitter,
            website: typeof this.website === "undefined" ? this.profileData.website : this.website,
            discord: typeof this.discord === "undefined" ? this.profileData.discord : this.discord,
            instagram: typeof this.instagram === "undefined" ? this.profileData.instagram : this.instagram,
            name: typeof this.name === "undefined" ? this.profileData.name : this.name,
            photoLocation: this.photoLocation != "" ? this.photoLocation : this.profileData.photoLocation,
            collector: this.profileData?.collector ? this.profileData?.collector : "",
            creator: this.profileData?.creator ? this.profileData?.creator : "",
          })
          .then(
            (res) => {
              console.log(res);
              console.log(this.photoLocation);
            },
            (err) => reject(err)
          );
      });
    }

    // This should only happen on the very first update of profile
    return new Promise<any>((resolve, reject) => {
      this.firestore
        .collection("profile-details")
        .doc(this.globalVars.loggedInUser?.PublicKeyBase58Check)
        .set({
          twitter: typeof this.twitter === "undefined" ? "" : this.twitter,
          website: typeof this.website === "undefined" ? "" : this.website,
          discord: typeof this.discord === "undefined" ? "" : this.discord,
          instagram: typeof this.instagram === "undefined" ? "" : this.instagram,
          name: typeof this.name === "undefined" ? "" : this.name,
          photoLocation: this.photoLocation,
          collector: this.profileData?.collector ? this.profileData?.collector : "",
          creator: this.profileData?.creator ? this.profileData?.creator : "",
        })
        .then(
          (res) => {},
          (err) => reject(err)
        );
    });
  }
  _resetImage() {
    this.profilePicInput = "";
  }
}
