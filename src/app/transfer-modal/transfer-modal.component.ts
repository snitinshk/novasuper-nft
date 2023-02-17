import { Component, NgModule, OnInit, Input } from "@angular/core";
import { BsModalService } from "ngx-bootstrap/modal";
import { BsModalRef } from "ngx-bootstrap/modal";
import {
  ProfileEntryResponse,
  BackendApiService,
  NFTEntryResponse,
  PostEntryResponse,
  NFTBidEntryResponse,
} from "../backend-api.service";
import { GlobalVarsService } from "../global-vars.service";
import _ from "lodash";
import { GoogleAnalyticsService } from "../google-analytics.service";

@Component({
  selector: "app-transfer-modal",
  templateUrl: "./transfer-modal.component.html",
  styleUrls: ["./transfer-modal.component.scss"],
})
export class TransferModalComponent implements OnInit {
  @Input() postHashHex: string;
  @Input() post: PostEntryResponse;
  @Input() serialNumbers: [];
  @Input() decryptableNFTEntryResponses: NFTEntryResponse[];
  @Input() nftEntryResponses: NFTEntryResponse[];
  @Input() acceptModal: boolean;
  @Input() transferModal: boolean;
  @Input() burnModal: boolean;
  transferToPublicKey = "";
  step = 1;
  serialNumberToSend: number;
  transferToCreator: ProfileEntryResponse;
  startingSearchText = "";
  unlockableText = "";
  transferNftUnlockableText = "";
  showInput = false;
  showDangerText = false;
  showDangerTextSendingToSelf = false;

  constructor(
    private analyticsService: GoogleAnalyticsService,
    public bsModalRef: BsModalRef,
    public modalService: BsModalService,
    public backendApi: BackendApiService,
    public globalVars: GlobalVarsService
  ) {}

  // Get default ser
  ngOnInit(): void {
    this.getNFTEntries();
    // IMPROVE
    for (let x of this.serialNumbers) {
      this.serialNumberToSend = x["SerialNumber"];
      break;
    }
  }

  stepTwo() {
    if (this.transferModal && !this.transferToCreator) {
      this.showDangerText = true;
    } else if (this.transferModal && this.transferToPublicKey === this.globalVars.loggedInUser.PublicKeyBase58Check) {
      this.showDangerTextSendingToSelf = true;
    } else {
      this.step = 2;
    }
  }

  stepThree() {
    this.step = 3;
  }

  getNFTEntries() {
    this.backendApi
      .GetNFTEntriesForNFTPost(
        this.globalVars.localNode,
        this.globalVars.loggedInUser?.PublicKeyBase58Check,
        this.postHashHex
      )
      .subscribe((res) => {
        this.nftEntryResponses = res.NFTEntryResponses;
        this.nftEntryResponses.sort((a, b) => a.SerialNumber - b.SerialNumber);
        this.decryptableNFTEntryResponses = this.nftEntryResponses.filter(
          (sn) =>
            sn.OwnerPublicKeyBase58Check === this.globalVars.loggedInUser?.PublicKeyBase58Check &&
            sn.EncryptedUnlockableText &&
            sn.LastOwnerPublicKeyBase58Check
        );
        if (this.decryptableNFTEntryResponses.length) {
          this.backendApi
            .DecryptUnlockableTexts(
              this.globalVars.loggedInUser?.PublicKeyBase58Check,
              this.decryptableNFTEntryResponses
            )
            .subscribe((res) => (this.decryptableNFTEntryResponses = res));
        }
      });
  }

  // Sets ser from select
  setSer(serialNumber) {
    this.serialNumberToSend = parseInt(serialNumber);
    this.getUnlockableBySer(this.serialNumberToSend);
    this.unlockableText = "";
  }

  // Handles getting the creator from searchbar
  _handleCreatorSelectedInSearch(creator: ProfileEntryResponse) {
    this.transferToCreator = creator;
    this.transferToPublicKey = creator?.PublicKeyBase58Check || "";
    this.showDangerText = false;
    this.showDangerTextSendingToSelf = false;
  }

  getUnlockableBySer(serialnumber) {
    let list = this.decryptableNFTEntryResponses.filter((ser) => ser.SerialNumber === serialnumber);
    console.log(list);
    if (list[0]?.DecryptedUnlockableText != "") {
      return list[0]?.DecryptedUnlockableText;
    }
    return "";
  }

  runCheck() {
    const hasUnlockable = this.post["HasUnlockable"];
    if (hasUnlockable) {
      if (!this.showInput) {
        this.unlockableText = this.getUnlockableBySer(this.serialNumberToSend);
      }
      if (this.unlockableText) {
        // Already have decrypted unlockable text
        this.transferNftUnlockableText = this.unlockableText;
        if (this.step === 2) {
          this.transfer();
        } else {
          this.stepTwo();
        }
      } else {
        // Entry requires unlockable text, but we don't have any
        this.showInput = true;
      }
    } else {
      if (this.step === 2) {
        this.transfer();
      } else {
        this.stepTwo();
      }
    }
  }
  hideAndRefresh() {
    this.bsModalRef.hide();
    window.location.reload();
  }
  // The transfer itself
  transfer() {
    this.backendApi
      .TransferNFT(
        this.globalVars.localNode,
        this.globalVars.loggedInUser?.PublicKeyBase58Check,
        this.transferToCreator.PublicKeyBase58Check,
        this.postHashHex,
        this.serialNumberToSend,
        this.transferNftUnlockableText,
        this.globalVars.defaultFeeRateNanosPerKB
      )
      .subscribe(
        (res: any) => {
          this.stepThree();
          this.SendTransferEvent();
        },
        (error) => {
          this.globalVars._alertError(error.error.error);
        }
      );
  }
  SendTransferEvent() {
    this.analyticsService.eventEmitter("nft_transferred", "usage", "activity", "transaction", 10);
  }
  SendReceiveEvent() {
    this.analyticsService.eventEmitter("nft_transfer_accepted", "usage", "activity", "event", 10);
  }
  SendBurnEvent() {
    this.analyticsService.eventEmitter("nft_burned", "usage", "activity", "event", 10);
  }
  acceptNFTTransfer() {
    this.backendApi
      .AcceptNFTTransfer(
        this.globalVars.localNode,
        this.globalVars.loggedInUser?.PublicKeyBase58Check,
        this.postHashHex,
        this.serialNumberToSend,
        this.globalVars.defaultFeeRateNanosPerKB
      )
      .subscribe(
        (res: any) => {
          this.stepThree();
          // Event logging for nft tranfer accepting
          this.SendReceiveEvent();
        },
        (error) => {
          this.globalVars._alertError(error.error.error);
        }
      );
  }
  burnNFT() {
    this.backendApi
      .BurnNFT(
        this.globalVars.localNode,
        this.globalVars.loggedInUser?.PublicKeyBase58Check,
        this.postHashHex,
        this.serialNumberToSend,
        this.globalVars.defaultFeeRateNanosPerKB
      )
      .subscribe(
        (res: any) => {
          this.stepThree();
          this.SendBurnEvent();
        },
        (error) => {
          this.globalVars._alertError(error.error.error);
        }
      );
  }
}
