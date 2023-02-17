import { Component, OnInit, Input } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";

@Component({
  selector: "message",
  templateUrl: "./message.component.html",
  styleUrls: ["./message.component.scss"],
})
export class MessageComponent {
  @Input() message: any;
  @Input() nextMessage: any;
  @Input() profile: any;
  @Input() counterpartyName: any;

  constructor(public globalVars: GlobalVarsService) {}
}
