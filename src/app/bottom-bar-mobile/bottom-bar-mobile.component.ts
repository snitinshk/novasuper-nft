import { Component, Input, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { AppRoutingModule } from "../app-routing.module";
import { CreatePostUploadMintComponent } from "../create-post-upload-mint/create-post-upload-mint.component";
import { CreateYourNftComponent } from "../create-your-nft/create-your-nft.component";
import { MintYourNftComponent } from "../mint-your-nft/mint-your-nft.component";
import { MatDialog } from "@angular/material/dialog";
import { PlaceABidComponent } from "../place-a-bid/place-a-bid.component";
import { CreatePostComponent } from "../create-post/create-post.component";

@Component({
  selector: "bottom-bar-mobile",
  templateUrl: "./bottom-bar-mobile.component.html",
  styleUrls: ["./bottom-bar-mobile.component.scss"],
})
export class BottomBarMobileComponent implements OnInit {
  @Input() showPostButton = false;
  lastScrollTop = 0;
  AppRoutingModule = AppRoutingModule;

  constructor(public globalVars: GlobalVarsService, public dialog: MatDialog) {}

  // createPost(): void {
  //   const dialogRef = this.dialog.open(CreatePostUploadMintComponent, {
  //     width: '620px',
  //     panelClass: 'popup-modal'
  //   });
  // }

  createPostUploadMint(): void {
    const dialogRef = this.dialog.open(CreatePostUploadMintComponent, {
      width: "620px",
      panelClass: "popup-modal",
    });
  }

  createPost(): void {
    const dialogRef = this.dialog.open(CreatePostComponent, {
      width: "620px",
      panelClass: "popup-modal",
    });
  }

  mintYourNFT(): void {
    const dialogRef = this.dialog.open(MintYourNftComponent, {
      width: "500px",
      panelClass: "popup-modal",
    });
  }

  createYourNFT(): void {
    const dialogRef = this.dialog.open(CreateYourNftComponent, {
      width: "500px",
      panelClass: "popup-modal",
    });
  }

  placeBid(): void {
    const dialogRef = this.dialog.open(PlaceABidComponent, {
      width: "600px",
      panelClass: "popup-modal",
    });
  }
  ngOnInit() {
    let handle = null;
  }
}
