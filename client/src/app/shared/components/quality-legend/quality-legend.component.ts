import { Component } from '@angular/core';

@Component({
  selector: 'app-quality-legend',
  standalone: true,
  template: `
    <div class="quality-legend">
      <span class="legend-title">Staining Quality:</span>
      <span class="legend-item">
        <span class="legend-swatch quality-row-green"></span>
        <span>Green — Good</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch quality-row-yellow"></span>
        <span>Yellow — Mediocre</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch quality-row-grey"></span>
        <span>Grey — Not working</span>
      </span>
      <span class="legend-item">
        <span class="legend-swatch quality-row-none"></span>
        <span>None — Not evaluated</span>
      </span>
    </div>
  `,
  styles: [`
    .quality-legend {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      padding: 8px 12px;
      margin-bottom: 12px;
      border: 1px solid var(--border-default);
      border-radius: 6px;
      background: var(--bg-secondary);
      font-size: 13px;
      color: var(--text-secondary);
    }
    .legend-title {
      font-weight: 600;
      color: var(--text-primary);
    }
    .legend-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .legend-swatch {
      display: inline-block;
      width: 18px;
      height: 14px;
      border-radius: 3px;
      border: 1px solid var(--border-default);
    }
    .quality-row-green  { background-color: rgba(76, 175, 80, 0.35); }
    .quality-row-yellow { background-color: rgba(255, 152, 0, 0.35); }
    .quality-row-grey   { background-color: rgba(158, 158, 158, 0.35); }
    .quality-row-none   { background-color: transparent; }
  `],
})
export class QualityLegendComponent { }
