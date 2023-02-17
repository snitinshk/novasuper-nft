import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { RouteNames } from "../../app-routing.module";
import { GoogleAnalyticsService } from "src/app/google-analytics.service";

@Component({
  selector: "update-profile-get-starter-deso",
  templateUrl: "./update-profile-get-starter-deso.component.html",
  styleUrls: ["./update-profile-get-starter-deso.component.scss"],
})
export class UpdateProfileGetStarterDeSoComponent {
  RouteNames = RouteNames;

  constructor(public globalVars: GlobalVarsService, private analyticsService: GoogleAnalyticsService) {}

  // rounded to nearest integer
  ngOnInit() {
    this.SendCreateProfileVisitEvent();
  }
  SendCreateProfileVisitEvent() {
    this.analyticsService.eventEmitter("create_profile_visit", "usage", "activity", "event", 10);
  }
  minPurchaseAmountInUsdRoundedUp() {
    const satoshisPerBitcoin = 1e8;
    let minimumInBitcoin = this.globalVars.minSatoshisBurnedForProfileCreation / satoshisPerBitcoin;
    return Math.ceil(this.globalVars.usdPerBitcoinExchangeRate * minimumInBitcoin);
  }

  getCreateProfileMessage(): string {
    return this.globalVars.showPhoneNumberVerification
      ? `You need to verify a phone number or purchase DeSo with Bitcoin in order to create a profile.
  This helps prevent spam.`
      : `You need to buy DeSo with Bitcoin in order to create a profile.  This helps prevent spam.`;
  }
}
