import { Component, HostListener, Input, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: "app-page-small-nav",
  templateUrl: "./page-small-nav.component.html",
  styleUrls: ["./page-small-nav.component.scss"],
})
export class PageSmallNavComponent implements OnInit {
  @Input() hideSidebar: string;
  @Input() showPostButton = false;
  @Input() inTutorial: boolean = false;
  @Input() marketplace: boolean = false;
  mobile = false;

  @HostListener("window:resize") onResize() {
    this.setMobileBasedOnViewport();
  }

  constructor(private globalVars: GlobalVarsService) {}

  ngOnInit() {
    this.setMobileBasedOnViewport();
  }

  setMobileBasedOnViewport() {
    this.mobile = this.globalVars.isMobile();
  }
  openMarketplaceMobileFiltering() {
    this.globalVars.isMarketplaceLeftBarMobileOpen = true;
  }
}
