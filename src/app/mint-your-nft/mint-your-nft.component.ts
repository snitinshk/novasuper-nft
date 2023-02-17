import { Component, Input, Inject } from "@angular/core";
import { BackendApiService } from "../backend-api.service";
import { GlobalVarsService } from "../global-vars.service";
// import { BsModalRef } from "ngx-bootstrap/modal";
import { BsModalService } from "ngx-bootstrap/modal";
import { Router } from "@angular/router";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

@Component({
  selector: "app-mint-your-nft",
  templateUrl: "./mint-your-nft.component.html",
  styleUrls: ["./mint-your-nft.component.scss"],
})
export class MintYourNftComponent {
  IS_SINGLE_COPY = "isSingleCopy";
  IS_MULTIPLE_COPIES = "isMultipleCopies";
  @Input() post: any;

  globalVars: GlobalVarsService;
  minting = false;

  // Settings.
  copiesRadioValue = this.IS_SINGLE_COPY;
  numCopies: number = 1;
  putOnSale: boolean = true;
  minBidAmountUSD: string = "0";
  minBidAmountDESO: number = 0;
  creatorRoyaltyPercent: any = 5;
  coinRoyaltyPercent: any = 10;
  includeUnlockable: boolean = false;
  createNFTFeeNanos: number;
  maxCopiesPerNFT: number;

  // Errors.
  unreasonableRoyaltiesSet: boolean = false;
  unreasonableNumCopiesSet: boolean = false;

  constructor(
    private _globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private modalService: BsModalService,
    private router: Router,
    private diaref: MatDialogRef<MintYourNftComponent>,
    @Inject(MAT_DIALOG_DATA) public data
  ) {
    this.globalVars = _globalVars;
    this.backendApi
      .GetGlobalParams(this.globalVars.localNode, this.globalVars.loggedInUser.PublicKeyBase58Check)
      .subscribe((res) => {
        this.createNFTFeeNanos = res.CreateNFTFeeNanos;
        this.maxCopiesPerNFT = res.MaxCopiesPerNFT;
      });
  }

  // hasUnreasonableRoyalties() {
  //   let isEitherUnreasonable =
  //     this.creatorRoyaltyPercent < 0 ||
  //     this.creatorRoyaltyPercent > 100 ||
  //     this.coinRoyaltyPercent < 0 ||
  //     this.coinRoyaltyPercent > 100;
  //   let isSumUnreasonable = this.creatorRoyaltyPercent + this.coinRoyaltyPercent > 100;
  //   console.log(this.creatorRoyaltyPercent);
  //   return isEitherUnreasonable || isSumUnreasonable;
  // }

  hasUnreasonableRoyalties() {
    let isEitherUnreasonable =
      Number(this.creatorRoyaltyPercent) < 0 ||
      Number(this.creatorRoyaltyPercent) > 100 ||
      Number(this.coinRoyaltyPercent) < 0 ||
      Number(this.coinRoyaltyPercent) > 100;
    let isSumUnreasonable = Number(this.creatorRoyaltyPercent) + Number(this.coinRoyaltyPercent) > 100;
    return isEitherUnreasonable || isSumUnreasonable;
  }

  hasUnreasonableNumCopies() {
    return this.numCopies > (this.maxCopiesPerNFT || 1000) || this.numCopies < 1;
  }

  hasUnreasonableMinBidAmount() {
    return parseFloat(this.minBidAmountUSD) < 0 || this.minBidAmountDESO < 0;
    // return parseFloat(this.minBidAmountUSD) < 0;
  }

  updateMinBidAmountUSD(desoAmount) {
    this.minBidAmountUSD = this.globalVars.nanosToUSDNumber(desoAmount * 1e9).toFixed(2);
  }

  updateMinBidAmountDESO(usdAmount) {
    this.minBidAmountDESO = Math.trunc(this.globalVars.usdToNanosNumber(usdAmount)) / 1e9;
  }

  // TODO: Compute service fee based on number of copies.
  mintNft() {
    if (this.hasUnreasonableRoyalties() || this.hasUnreasonableMinBidAmount()) {
      // It should not be possible to trigger this since the button is disabled w/these conditions.
      return;
    }

    let numCopiesToMint = this.numCopies;
    if (this.copiesRadioValue === this.IS_SINGLE_COPY) {
      numCopiesToMint = 1;
    }

    let creatorRoyaltyBasisPoints = 0;
    if (this.creatorRoyaltyPercent) {
      creatorRoyaltyBasisPoints = this.creatorRoyaltyPercent * 100;
    }

    let coinRoyaltyBasisPoints = 0;
    if (this.coinRoyaltyPercent) {
      coinRoyaltyBasisPoints = this.coinRoyaltyPercent * 100;
    }

    this.minting = true;
    this.backendApi
      .CreateNft(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.data.post.PostHashHex,
        numCopiesToMint,
        creatorRoyaltyBasisPoints,
        coinRoyaltyBasisPoints,
        this.includeUnlockable,
        this.putOnSale,
        Math.trunc(this.minBidAmountDESO * 1e9),
        this.globalVars.defaultFeeRateNanosPerKB
      )
      .subscribe(
        (res) => {
          this.dropNFT();
          this.globalVars.updateEverything(res.TxnHashHex, this._mintNFTSuccess, this._mintNFTFailure, this);
        },
        (err) => {
          this.globalVars._alertError(err.error.error);
          this.minting = false;
        }
      );
  }

  _mintNFTSuccess(comp: MintYourNftComponent) {
    comp.minting = false;
    comp.router.navigate(["/" + comp.globalVars.RouteNames.NFT + "/" + comp.data.post.PostHashHex]);
    //comp.bsModalRef.hide();
    comp.diaref.close();
  }

  _mintNFTFailure(comp: MintYourNftComponent) {
    comp.minting = false;
    comp.globalVars._alertError("Transaction broadcast successfully but read node timeout exceeded. Please refresh.");
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
            this.globalVars._alertError(
              "NFT Minted but adding to marketplace failed, contact Supernovas team for assistance."
            );
            return;
          }

          this.addNFTToLatestDrop(res.DropEntry, this.data.post.PostHashHex);
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
        },
        (error) => {
          this.globalVars._alertError(error.error.error);
        }
      );
  }
}
