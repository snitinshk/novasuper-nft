import { Component, Input } from "@angular/core";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { GlobalVarsService } from "../global-vars.service";
import { Router } from "@angular/router";
import { SharedDialogs } from "src/lib/shared-dialogs";
import { CommentModalComponent } from "../comment-modal/comment-modal.component";
import { PostEntryResponse } from "../backend-api.service";

@Component({
  selector: "nft-sold-modal",
  templateUrl: "./nft-sold-modal.component.html",
})
export class NftSoldModalComponent {
  @Input() afterRepostCreatedCallback: any = null;
  @Input() afterCommentCreatedCallback: any = null;
  @Input() post: PostEntryResponse;
  constructor(
    public bsModalRef: BsModalRef,
    public modalService: BsModalService,
    private globalVars: GlobalVarsService,
    private router: Router
  ) {}
  viewMyNFTs(): void {
    this.modalService.setDismissReason("view_my_nfts");
    this.bsModalRef.hide();
    this.router.navigate(
      ["/" + this.globalVars.RouteNames.USER_PREFIX, this.globalVars.loggedInUser?.ProfileEntryResponse?.Username],
      {
        queryParams: { tab: "nfts" },
      }
    );
  }
  reload() {
    window.location.reload();
  }
  quoteRepost(event, isQuote: boolean = false) {
    // Prevent the post navigation click from occurring.
    event.stopPropagation();

    if (!this.globalVars.loggedInUser) {
      // Check if the user has an account.
      this.globalVars.logEvent("alert : reply : account");
      SharedDialogs.showCreateAccountToPostDialog(this.globalVars);
    } else if (!this.globalVars.doesLoggedInUserHaveProfile()) {
      // Check if the user has a profile.
      this.globalVars.logEvent("alert : reply : profile");
      SharedDialogs.showCreateProfileToPostDialog(this.router);
    } else {
      const initialState = {
        // If we are quoting a post, make sure we pass the content so we don't repost a repost.
        parentPost: this.post,
        afterCommentCreatedCallback: isQuote ? this.bsModalRef.hide() : this.afterCommentCreatedCallback,
        isQuote,
      };

      // If the user has an account and a profile, open the modal so they can comment.
      this.modalService.show(CommentModalComponent, {
        class: "modal-dialog-centered",
        initialState,
      });
    }
  }
}
