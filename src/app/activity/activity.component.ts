import { ChangeDetectorRef, Component, HostListener, OnInit } from "@angular/core";
import {
  BackendApiService,
  NFTBidEntryResponse,
  NFTEntryResponse,
  PostEntryResponse,
  ProfileEntryResponse,
} from "../backend-api.service";
import { BsModalService } from "ngx-bootstrap/modal";
import { PlaceBidModalComponent } from "../place-bid-modal/place-bid-modal.component";
import { GlobalVarsService } from "../global-vars.service";
import { ActivatedRoute, Router } from "@angular/router";
import { Location } from "@angular/common";
import { IAdapter, IDatasource } from "ngx-ui-scroll";
import * as _ from "lodash";
import { InfiniteScroller } from "../infinite-scroller";
import { Subscription } from "rxjs";
import { SwalHelper } from "../../lib/helpers/swal-helper";
import { FeedPostImageModalComponent } from "../feed/feed-post-image-modal/feed-post-image-modal.component";

@Component({
  selector: "app-activity",
  templateUrl: "./activity.component.html",
  styleUrls: ["./activity.component.scss"],
})
export class ActivityComponent implements OnInit {
  static PAGE_SIZE = 10;
  static BUFFER_SIZE = 5;
  static WINDOW_VIEWPORT = true;
  static PADDING = 0.5;

  nftResponse: { NFTEntryResponses: NFTEntryResponse[]; PostEntryResponse: PostEntryResponse }[];
  responseHolder: { NFTEntryResponses: NFTEntryResponse[]; PostEntryResponse: PostEntryResponse }[];
  myBids: NFTBidEntryResponse[];
  receivedNFTResponse = [];

  lastPage = null;
  isLoading = true;
  loadingNewSelection = false;
  static BIDS_MADE = "Bids Made";
  static TRANSFERS = "Transfers";
  static BIDS_RECEIVED = "Bids Received";
  tabs = [ActivityComponent.BIDS_MADE, ActivityComponent.BIDS_RECEIVED, ActivityComponent.TRANSFERS];
  activeTab: string;
  mobile = false;

  @HostListener("window:resize") onResize() {
    this.setMobileBasedOnViewport();
  }

  static TABS = {
    transfers: "Transfers",
    active_bids: "Bids Made",
    bids_received: "Bids Received",
  };
  static TABS_LOOKUP = {
    [ActivityComponent.TRANSFERS]: "transfers",
    [ActivityComponent.BIDS_RECEIVED]: "bids_made",
    [ActivityComponent.BIDS_RECEIVED]: "bids_received",
  };

  constructor(
    private globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private location: Location,
    private modalService: BsModalService
  ) {
    this.route.queryParams.subscribe((params) => {
      this.activeTab =
        params.tab && params.tab in ActivityComponent.TABS ? ActivityComponent.TABS[params.tab] : "Bids Made";
    });
  }
  afterUserBlocked(blockedPubKey: any) {
    this.globalVars.loggedInUser.BlockedPubKeys[blockedPubKey] = {};
  }

  afterNftBidPlaced() {
    this.getNFTBids();
  }

  ngOnInit(): void {
    this.setMobileBasedOnViewport();
    this.route.queryParams.subscribe((queryParams) => {
      let tab = queryParams.tab || "bids_made";
      if (tab === "transfers") {
        this.getNFTs(this.getIsForSaleValue()).add();
      } else if (tab === "bids_made") {
        // Get BIDS
        this.getNFTBids();
      } else {
        this.getOwnedNFTS();
        this.isLoading = false;
      }
    });
  }
  openPlaceBidModal(event: any, postEntryResponse) {
    if (!this.globalVars.loggedInUser?.ProfileEntryResponse) {
      this.globalVars._alertError("Create profile to perform this action...");
      return;
    }
    event.stopPropagation();
    const modalDetails = this.modalService.show(PlaceBidModalComponent, {
      class: "modal-dialog-centered nft_placebid_modal_bx modal-lg",
      initialState: { post: postEntryResponse },
    });
    // post: this.postContent
    const onHideEvent = modalDetails.onHide;
    onHideEvent.subscribe((response) => {
      if (response === "bid placed") {
        this.getNFTBids();
      }
    });
  }
  openImgModal(event, imageURL) {
    event.stopPropagation();
    this.modalService.show(FeedPostImageModalComponent, {
      class: "modal-dialog-centered modal-lg",
      initialState: {
        imageURL,
      },
    });
  }
  mapImageURLs(imgURL: string): string {
    if (imgURL.startsWith("https://i.imgur.com")) {
      return imgURL.replace("https://i.imgur.com", "https://images.bitclout.com/i.imgur.com");
    }
    return imgURL;
  }
  setMobileBasedOnViewport() {
    this.mobile = this.globalVars.isMobile();
  }

  infiniteScroller: InfiniteScroller = new InfiniteScroller(
    ActivityComponent.PAGE_SIZE,
    this.getPage.bind(this),
    ActivityComponent.WINDOW_VIEWPORT,
    ActivityComponent.BUFFER_SIZE,
    ActivityComponent.PADDING
  );
  datasource: IDatasource<IAdapter<any>> = this.infiniteScroller.getDatasource();

  cancelBid(bidEntry: NFTBidEntryResponse): void {
    SwalHelper.fire({
      target: this.globalVars.getTargetComponentSelector(),
      title: "Cancel Bid",
      html: `Are you sure you'd like to cancel this bid?`,
      showCancelButton: true,
      customClass: {
        confirmButton: "btn btn-light",
        cancelButton: "btn btn-light no",
      },
      reverseButtons: true,
    }).then((res) => {
      if (res.isConfirmed) {
        this.backendApi
          .CreateNFTBid(
            this.globalVars.localNode,
            this.globalVars.loggedInUser.PublicKeyBase58Check,
            bidEntry.PostEntryResponse.PostHashHex,
            bidEntry.SerialNumber,
            0,
            this.globalVars.defaultFeeRateNanosPerKB
          )
          .subscribe(
            () => {
              window.location.reload();
              return this.datasource.adapter.remove({
                predicate: ({ data }) => {
                  const currBidEntry = (data as any) as NFTBidEntryResponse;
                  return (
                    currBidEntry.SerialNumber === bidEntry.SerialNumber &&
                    currBidEntry.BidAmountNanos === currBidEntry.BidAmountNanos &&
                    currBidEntry.PostEntryResponse.PostHashHex === bidEntry.PostEntryResponse.PostHashHex
                  );
                },
              });
            },
            (err) => {
              console.error(err);
            }
          );
      }
    });
  }

  getOwnedNFTS(): Subscription {
    this.isLoading = true;
    this.receivedNFTResponse = [];
    return this.backendApi
      .GetNFTsForUser(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        true
      )
      .subscribe(
        (res: {
          NFTsMap: { [k: string]: { PostEntryResponse: PostEntryResponse; NFTEntryResponses: NFTEntryResponse[] } };
        }) => {
          for (const k in res.NFTsMap) {
            this.backendApi
              .GetNFTBidsForNFTPost(this.globalVars.localNode, this.globalVars.loggedInUser?.PublicKeyBase58Check, k)
              .subscribe((res) => {
                this.receivedNFTResponse.push(res);
              });
          }
          this.isLoading = false;
        },
        (err) => {
          this.isLoading = false;
          this.globalVars._alertError("Problem fetching received bids...");
        }
      );
  }
  checkNFTbidsReceived() {
    for (let x of this.receivedNFTResponse) {
      if (x.BidEntryResponses) {
        return true;
      }
    }
    return false;
  }
  getPage(page: number) {
    if (this.lastPage != null && page > this.lastPage) {
      return [];
    }
    const startIdx = page * ActivityComponent.PAGE_SIZE;
    const endIdx = (page + 1) * ActivityComponent.PAGE_SIZE;

    return new Promise((resolve, reject) => {
      resolve(
        this.activeTab === ActivityComponent.BIDS_MADE
          ? this.myBids.slice(startIdx, Math.min(endIdx, this.myBids.length))
          : this.nftResponse.slice(startIdx, Math.min(endIdx, this.nftResponse.length))
      );
    });
  }

  _handleTabClick(tabName: string) {
    this.activeTab = tabName;
    // Update query params to reflect current tab
    const urlTree = this.router.createUrlTree([], {
      queryParams: { tab: ActivityComponent.TABS_LOOKUP[tabName] || "bids_made" },
      queryParamsHandling: "merge",
      preserveFragment: true,
    });
    this.location.go(urlTree.toString());

    if (this.activeTab === "Transfers") {
      return this.getNFTs(this.getIsForSaleValue()).add(() => {
        this.resetDatasource(event);
      });
    } else if (this.activeTab === "Bids Made") {
      // Get BIDS
      return this.getNFTBids().add(() => {
        this.resetDatasource(event);
      });
    } else {
      return this.getOwnedNFTS().add(() => {
        this.resetDatasource(event);
      });
    }
  }

  resetDatasource(event): void {
    this.infiniteScroller.reset();
    this.datasource.adapter.reset().then(() => {
      this.loadingNewSelection = false;
      this.isLoading = false;
    });
  }

  getNFTBids(): Subscription {
    this.isLoading = true;
    return this.backendApi
      .GetNFTBidsForUser(
        this.globalVars.localNode,
        this.globalVars.loggedInUser?.PublicKeyBase58Check,
        this.globalVars.loggedInUser?.PublicKeyBase58Check
      )
      .subscribe(
        (res: {
          PublicKeyBase58CheckToProfileEntryResponse: { [k: string]: ProfileEntryResponse };
          PostHashHexToPostEntryResponse: { [k: string]: PostEntryResponse };
          NFTBidEntries: NFTBidEntryResponse[];
        }) => {
          _.forIn(res.PostHashHexToPostEntryResponse, (value, key) => {
            value.ProfileEntryResponse =
              res.PublicKeyBase58CheckToProfileEntryResponse[value.PosterPublicKeyBase58Check];
            res.PostHashHexToPostEntryResponse[key] = value;
          });
          this.myBids = res.NFTBidEntries.map((bidEntry) => {
            bidEntry.PostEntryResponse = res.PostHashHexToPostEntryResponse[bidEntry.PostHashHex];
            return bidEntry;
          });
          this.myBids = this.myBids.sort(
            (a, b) => a.PostEntryResponse.TimestampNanos - b.PostEntryResponse.TimestampNanos
          );
          this.lastPage = Math.floor(this.myBids.length / ActivityComponent.PAGE_SIZE);
          this.isLoading = false;
          return this.myBids;
        }
      );
  }

  getNFTs(isForSale: boolean | null = null): Subscription {
    this.isLoading = true;
    return this.backendApi
      .GetNFTsForUser(
        this.globalVars.localNode,
        this.globalVars.loggedInUser?.PublicKeyBase58Check,
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
            if (this.activeTab === ActivityComponent.TRANSFERS) {
              if (responseElement.NFTEntryResponses[0].IsPending) {
                this.nftResponse.push(responseElement);
              }
            }
          }
          this.lastPage = Math.floor(this.nftResponse.length / ActivityComponent.PAGE_SIZE);
          this.isLoading = false;
          return this.nftResponse;
        }
      );
  }
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
  getIsForSaleValue(): boolean | null {
    if (this.activeTab === ActivityComponent.TRANSFERS) {
      return false;
    } else if (this.activeTab === ActivityComponent.BIDS_MADE) {
      return null;
    }
  }
  onScroll() {
    console.log("scrolling");
  }
}
