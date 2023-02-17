import { Component, Input, OnInit } from "@angular/core";
import { AddUnlockableModalComponent } from "../add-unlockable-modal/add-unlockable-modal.component";
import { NFTBidEntryResponse } from "../backend-api.service";
import { GlobalVarsService } from "../global-vars.service";
import { BsModalService } from "ngx-bootstrap/modal";
import { SellNftModalComponent } from "../sell-nft-modal/sell-nft-modal.component";

@Component({
  selector: "app-bids-accordion",
  templateUrl: "./bids-accordion.component.html",
  styleUrls: ["./bids-accordion.component.scss"],
})
export class BidsAccordionComponent implements OnInit {
  @Input() nftEntry: any;
  accordionOpen = false;
  sellNFTDisabled = true;
  constructor(public globalVars: GlobalVarsService, private modalService: BsModalService) {}

  ngOnInit(): void {}

  mapImageURLs(imgURL: string): string {
    if (imgURL.startsWith("https://i.imgur.com")) {
      return imgURL.replace("https://i.imgur.com", "https://images.bitclout.com/i.imgur.com");
    }
    return imgURL;
  }
  showAllBids() {
    this.accordionOpen = !this.accordionOpen;
  }

  toggleAccordion() {
    this.accordionOpen = !this.accordionOpen;
  }

  userOwnsSerialNumber(serialNumber: number): boolean {
    const loggedInPubKey = this.globalVars.loggedInUser.PublicKeyBase58Check;
    return !!this.nftEntry.NFTEntryResponses.filter(
      (nftEntryResponse) =>
        nftEntryResponse.SerialNumber === serialNumber && nftEntryResponse.OwnerPublicKeyBase58Check === loggedInPubKey
    ).length;
  }

  checkSelectedBidEntries(bidEntry: NFTBidEntryResponse): void {
    bidEntry.selected = true;
    this.nftEntry.BidEntryResponses.forEach((bidEntryResponse) => {
      if (
        bidEntryResponse.SerialNumber === bidEntry.SerialNumber &&
        bidEntry !== bidEntryResponse &&
        bidEntryResponse.selected
      ) {
        bidEntryResponse.selected = false;
      }
    });
    this.sellNFT();
  }

  sellNFT(): void {
    const sellNFTModalDetails = this.modalService.show(SellNftModalComponent, {
      class: "modal-dialog-center",
      initialState: {
        post: this.nftEntry.PostEntryResponse,
        nftEntries: this.nftEntry.NFTEntryResponses,
        selectedBidEntries: this.nftEntry.BidEntryResponses.filter((bidEntry) => bidEntry.selected),
      },
    });
    const onHiddenEvent = sellNFTModalDetails.onHidden;
    onHiddenEvent.subscribe((response) => {
      if (response === "nft sold") {
        // This is different from basic implementation
        window.location.reload();
      } else if (response === "unlockable content opened") {
        const unlockableModalDetails = this.modalService.show(AddUnlockableModalComponent, {
          class: "modal-dialog-centered",
          initialState: {
            post: this.nftEntry.PostEntryResponse,
            selectedBidEntries: this.nftEntry.BidEntryResponses.filter((bidEntry) => bidEntry.selected),
          },
        });
        const onHiddenEvent = unlockableModalDetails.onHidden;
        onHiddenEvent.subscribe((response) => {
          if (response === "nft sold") {
            // This is different from basic implementation
            window.location.reload();
          }
        });
      }
    });
  }
}
