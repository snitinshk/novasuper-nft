import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'loading-shimmer',
  templateUrl: './loading-shimmer.component.html',
  styleUrls: ['./loading-shimmer.component.scss']
})
export class LoadingShimmerComponent implements OnInit {

  constructor() { }
  @Input() tabType: string = "FEED";
  ngOnInit(): void {
    
  }

}
