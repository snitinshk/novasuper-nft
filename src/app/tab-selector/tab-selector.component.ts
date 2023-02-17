import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";

@Component({
  selector: "tab-selector",
  templateUrl: "./tab-selector.component.html",
  styleUrls: ["./tab-selector.component.scss"],
})
export class TabSelectorComponent implements OnInit {
  @Output() tabClick = new EventEmitter<string>();
  @Input() tabs: any; // Should be a list of strings with tab names.
  @Input() extraTab: string;
  @Input() activeTab: string;

  constructor() {}

  ngOnInit(): void {
    if (this.extraTab) {
      this.tabs.unshift(this.extraTab);
    }
  }

  _tabClicked(tab: string) {
    this.tabClick.emit(tab);
    this.activeTab = tab;
  }
  _isGlobal(tab: string) {
    if (tab === "Recent") {
      return true;
    }
    return false;
  }
}
function ngOnInit() {
  throw new Error("Function not implemented.");
}
