import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import {
  BackendApiService,
  NFTBidEntryResponse,
  NFTEntryResponse,
  PostEntryResponse,
  ProfileEntryResponse,
} from "../../backend-api.service";
import { GlobalVarsService } from "../../global-vars.service";
import { ActivatedRoute, Router } from "@angular/router";
import { Location } from "@angular/common";
import { IAdapter, IDatasource } from "ngx-ui-scroll";
import * as _ from "lodash";
import { InfiniteScroller } from "../../infinite-scroller";
import { of, Subscription } from "rxjs";
import { SwalHelper } from "../../../lib/helpers/swal-helper";

@Component({
  selector: "app-creator-profile-collected",
  templateUrl: "./creator-profile-collected.component.html",
  styleUrls: ["./creator-profile-collected.component.scss"],
})
export class CreatorProfileCollectedComponent implements OnInit {
  static PAGE_SIZE = 10;
  static BUFFER_SIZE = 5;
  static WINDOW_VIEWPORT = true;
  static PADDING = 0.5;

  startIndex = 0;
  endIndex = 10;

  @Input() profile: ProfileEntryResponse;
  @Input() afterCommentCreatedCallback: any = null;
  @Input() showProfileAsReserved: boolean;

  nftResponse: { NFTEntryResponses: NFTEntryResponse[]; PostEntryResponse: PostEntryResponse }[];
  dataToShow: { NFTEntryResponses: NFTEntryResponse[]; PostEntryResponse: PostEntryResponse }[];
  responseHolder: { NFTEntryResponses: NFTEntryResponse[]; PostEntryResponse: PostEntryResponse }[];
  myBids: NFTBidEntryResponse[];

  lastPage = null;
  isLoading = true;
  loadingNewSelection = false;
  static FOR_SALE = "For Sale";
  static MY_BIDS = "My Bids";
  static MY_GALLERY = "Gallery";
  static TRANSFERS = "Transfers";
  activeTab: string;
  constructor(
    private globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.getNFTs();
  }

  infiniteScroller: InfiniteScroller = new InfiniteScroller(
    CreatorProfileCollectedComponent.PAGE_SIZE,
    this.getPage.bind(this),
    CreatorProfileCollectedComponent.WINDOW_VIEWPORT,
    CreatorProfileCollectedComponent.BUFFER_SIZE,
    CreatorProfileCollectedComponent.PADDING
  );
  datasource: IDatasource<IAdapter<any>> = this.infiniteScroller.getDatasource();

  async _prependComment(uiPostParent, index, newComment) {
    const uiPostParentHashHex = this.globalVars.getPostContentHashHex(uiPostParent);
    await this.datasource.adapter.relax();
    await this.datasource.adapter.update({
      predicate: ({ $index, data, element }) => {
        let currentPost = (data as any) as PostEntryResponse;
        if ($index === index) {
          newComment.parentPost = currentPost;
          currentPost.Comments = currentPost.Comments || [];
          currentPost.Comments.unshift(_.cloneDeep(newComment));
          return [this.globalVars.incrementCommentCount(currentPost)];
        } else if (this.globalVars.getPostContentHashHex(currentPost) === uiPostParentHashHex) {
          // We also want to increment the comment count on any other notifications related to the same post hash hex.
          return [this.globalVars.incrementCommentCount(currentPost)];
        }
        // Leave all other items in the datasource as is.
        return true;
      },
    });
  }
  getPage(page: number) {
    if (this.lastPage != null && page > this.lastPage) {
      return [];
    }
    const startIdx = page * CreatorProfileCollectedComponent.PAGE_SIZE;
    const endIdx = (page + 1) * CreatorProfileCollectedComponent.PAGE_SIZE;

    return new Promise((resolve, reject) => {
      resolve(
        this.activeTab === CreatorProfileCollectedComponent.MY_BIDS
          ? this.myBids.slice(startIdx, Math.min(endIdx, this.myBids.length))
          : this.nftResponse.slice(startIdx, Math.min(endIdx, this.nftResponse.length))
      );
    });
  }

  profileBelongsToLoggedInUser(): boolean {
    return (
      this.globalVars.loggedInUser?.ProfileEntryResponse &&
      this.globalVars.loggedInUser.ProfileEntryResponse.PublicKeyBase58Check === this.profile.PublicKeyBase58Check
    );
  }

  getNFTs(isForSale: boolean | null = null): Subscription {
    this.isLoading = true;
    return this.backendApi
      .GetNFTsForUser(
        this.globalVars.localNode,
        this.profile.PublicKeyBase58Check,
        this.globalVars.loggedInUser?.PublicKeyBase58Check,
        isForSale
      )
      .subscribe(
        (res: {
          NFTsMap: { [k: string]: { PostEntryResponse: PostEntryResponse; NFTEntryResponses: NFTEntryResponse[] } };
        }) => {
          this.nftResponse = [];
          for (const k in res.NFTsMap) {
            const responseElement = res.NFTsMap[k];
            if (
              res.NFTsMap[k].PostEntryResponse.PosterPublicKeyBase58Check != this.profile.PublicKeyBase58Check &&
              !responseElement.NFTEntryResponses[0].IsPending
            ) {
              this.nftResponse.push(responseElement);
            }
          }
          this.dataToShow = this.nftResponse.slice(this.startIndex, this.endIndex);
          this.lastPage = Math.floor(this.nftResponse.length / CreatorProfileCollectedComponent.PAGE_SIZE);
          this.isLoading = false;
          return this.nftResponse;
        }
      );
  }

  onScroll() {
    if (this.endIndex <= this.nftResponse.length - 1) {
      this.startIndex = this.endIndex;
      this.endIndex += 20;
      this.dataToShow = [...this.dataToShow, ...this.nftResponse.slice(this.startIndex, this.endIndex)];
    }
  }
}
