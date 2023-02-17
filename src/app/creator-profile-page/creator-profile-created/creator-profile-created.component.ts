import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import {
  BackendApiService,
  NFTBidEntryResponse,
  NFTCollectionResponse,
  NFTEntryResponse,
  PostEntryResponse,
  ProfileEntryResponse,
} from "../../backend-api.service";
import { GlobalVarsService } from "../../global-vars.service";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { ActivatedRoute, Router } from "@angular/router";
import { Location } from "@angular/common";
import { IAdapter, IDatasource } from "ngx-ui-scroll";
import * as _ from "lodash";
import { InfiniteScroller } from "../../infinite-scroller";
import { of, Subscription } from "rxjs";
import { uniqBy } from "lodash";
import { catchError } from "rxjs/operators";

@Component({
  selector: "app-creator-profile-created",
  templateUrl: "./creator-profile-created.component.html",
  styleUrls: ["./creator-profile-created.component.scss"],
})
export class CreatorProfileCreatedComponent implements OnInit {
  static PAGE_SIZE = 10;
  static BUFFER_SIZE = 5;
  static WINDOW_VIEWPORT = true;
  static PADDING = 0.5;

  @Input() profile: ProfileEntryResponse;
  @Input() afterCommentCreatedCallback: any = null;
  @Input() showProfileAsReserved: boolean;

  posts: PostEntryResponse[];
  nftCollections: NFTCollectionResponse[];

  nftResponse: { NFTEntryResponses: NFTEntryResponse[]; PostEntryResponse: PostEntryResponse }[];
  dataToShow: PostEntryResponse[];
  responseHolder: { NFTEntryResponses: NFTEntryResponse[]; PostEntryResponse: PostEntryResponse }[];
  myBids: NFTBidEntryResponse[];

  startIndex = 0;
  endIndex = 10;

  lastPage = null;
  isLoading = true;
  loadingNewSelection = false;
  activeTab: string;

  constructor(
    private httpClient: HttpClient,
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
    CreatorProfileCreatedComponent.PAGE_SIZE,
    this.getPage.bind(this),
    CreatorProfileCreatedComponent.WINDOW_VIEWPORT,
    CreatorProfileCreatedComponent.BUFFER_SIZE,
    CreatorProfileCreatedComponent.PADDING
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
    const startIdx = page * CreatorProfileCreatedComponent.PAGE_SIZE;
    const endIdx = (page + 1) * CreatorProfileCreatedComponent.PAGE_SIZE;

    return new Promise((resolve, reject) => {
      resolve(this.nftResponse.slice(startIdx, Math.min(endIdx, this.nftResponse.length)));
    });
  }
  profileBelongsToLoggedInUser(): boolean {
    return (
      this.globalVars.loggedInUser?.ProfileEntryResponse &&
      this.globalVars.loggedInUser.ProfileEntryResponse.PublicKeyBase58Check === this.profile.PublicKeyBase58Check
    );
  }
  getNFTs() {
    this.isLoading = true;
    return this.backendApi
      .GetPostsForPublicKey(
        this.globalVars.localNode,
        "",
        this.profile.Username,
        this.globalVars.loggedInUser?.PublicKeyBase58Check,
        "",
        10000,
        false /*MediaRequired*/
      )
      .toPromise()
      .then((res) => {
        this.posts = res.Posts.filter((post) => post.IsNFT);
        this.dataToShow = this.posts.slice(this.startIndex, this.endIndex);
      })
      .finally(() => {
        this.isLoading = false;
      });
  }
  onScroll() {
    if (this.endIndex <= this.posts.length - 1) {
      this.startIndex = this.endIndex;
      this.endIndex += 20;
      this.dataToShow = [...this.dataToShow, ...this.posts.slice(this.startIndex, this.endIndex)];
    }
  }
}
