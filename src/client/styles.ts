const STYLE_ID = 'dsh-automation-styles'

const CSS_TEXT = `
.dsh-st-shell{box-sizing:border-box;max-width:1080px;width:100%;margin:0 auto;padding:0 0 32px;color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family,system-ui)}
.dsh-st-top{display:flex;flex-direction:column;align-items:stretch;gap:12px;margin-bottom:12px}
.dsh-st-heading h1,.dsh-st-top h1{margin:0;font-size:20px;line-height:28px;font-weight:650;letter-spacing:-.2px}
.dsh-st-heading p,.dsh-st-top p{margin:4px 0 0;max-width:none;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}
.dsh-st-toolbar{display:flex;flex-wrap:nowrap;align-items:center;justify-content:flex-start;gap:8px}
.dsh-st-search{flex:1;min-width:0;max-width:280px;height:32px;padding:0 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-bg-layer-1));color:inherit;font:inherit;font-size:13px}
.dsh-st-btn,.dsh-st-icon{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:32px;padding:0 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:transparent;color:inherit;font:inherit;font-size:13px;cursor:pointer;white-space:nowrap}
.dsh-st-icon{width:32px;padding:0;flex:none}
.dsh-st-btn--primary{border-color:transparent;background:var(--dsw-alias-button-primary-fill,#fff);color:var(--dsw-alias-label-primary-foreground,#111)}
.dsh-st-btn--danger{border-color:var(--dsw-alias-state-error-primary,#f85149);background:var(--dsw-alias-state-error-primary,#f85149);color:#fff}
.dsh-st-hint{margin:-6px 0 14px;padding:10px 12px;border-radius:12px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:12px}
.dsh-st-banner{display:flex;align-items:flex-start;gap:8px;margin-bottom:16px;padding:10px 14px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.5}
.dsh-st-banner>span{display:inline-flex;align-items:flex-start;gap:8px}
.dsh-st-switch{width:42px;height:26px;border:0;border-radius:999px;background:rgba(120,120,128,.36);box-shadow:inset 0 0 0 1px rgba(255,255,255,.06);position:relative;cursor:pointer}
.dsh-st-switch:after{content:'';position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.28);transition:transform .16s ease}
.dsh-st-switch.is-on{background:#34c759}
.dsh-st-switch.is-on:after{transform:translateX(16px)}
.dsh-st-examples{margin-bottom:22px}
.dsh-st-examples-head h2{margin:0 0 10px;font-size:13px;font-weight:600;color:var(--dsw-alias-label-secondary)}
.dsh-st-example-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.dsh-st-example{display:flex;flex-direction:column;align-items:flex-start;gap:8px;min-height:132px;padding:14px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.03));color:inherit;text-align:left;cursor:pointer}
.dsh-st-example:hover{border-color:rgba(75,124,255,.45)}
.dsh-st-example strong{font-size:14px}
.dsh-st-example p{margin:0;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.dsh-st-tabs{display:flex;align-items:center;gap:16px;margin:4px 0 16px}
.dsh-st-tabs>button{padding:8px 0;border:0;border-bottom:2px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.dsh-st-tabs>button.is-on{border-bottom-color:currentColor;color:var(--dsw-alias-label-primary);font-weight:650}
.dsh-st-dropdown{position:relative;min-width:0}
.dsh-st-sort-wrap{display:flex;align-items:center;gap:6px;margin-left:auto}
.dsh-st-dropdown-btn{display:inline-flex;align-items:center;gap:4px;max-width:220px;height:28px;padding:0 10px;border:0;border-radius:999px;background:var(--dsw-alias-bg-layer-3,rgba(255,255,255,.14));color:var(--dsw-alias-label-primary,inherit);font-family:inherit;font-size:13px;line-height:20px;cursor:pointer;white-space:nowrap}
.dsh-st-dropdown-btn:hover,.dsh-st-dropdown-btn.is-open{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.18))}
.dsh-st-dropdown-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-st-dropdown-chevron{flex:none;transition:transform .16s ease;transform:rotate(90deg)}
.dsh-st-dropdown-btn.is-open .dsh-st-dropdown-chevron{transform:rotate(-90deg)}
.dsh-st-dropdown-menu{box-sizing:border-box;position:absolute;right:0;top:calc(100% + 6px);z-index:30;width:max-content;min-width:180px;max-width:calc(100vw - 16px);max-height:260px;overflow-x:hidden;overflow-y:auto;padding:6px;border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.12));border-radius:12px;background:var(--dsw-alias-bg-layer-3,#303033);box-shadow:var(--dsw-shadow-lv3,0 8px 24px rgba(0,0,0,.32))}
.dsh-st-dropdown-menu.is-float{position:fixed;right:auto;top:auto;z-index:1200}
.dsh-st-dropdown-menu.dsh-st-dropdown-sort{min-width:0;transition:width .12s ease}
.dsh-st-dropdown-row{box-sizing:border-box;display:flex;align-items:center;justify-content:flex-start;gap:8px;width:100%;min-height:36px;padding:6px 10px;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary,inherit);font-family:inherit;font-size:13px;line-height:20px;cursor:pointer;text-align:left}
.dsh-st-dropdown-label-cell{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-st-dropdown-row:not(.has-trailing) .dsh-st-dropdown-label-cell{flex:1}
.dsh-st-dropdown-row.has-trailing .dsh-st-dropdown-label-cell{flex:none}
.dsh-st-dropdown-spacer{min-width:0}
.dsh-st-dropdown-row:not(.has-trailing) .dsh-st-dropdown-spacer{flex:0 0 0}
.dsh-st-dropdown-row.has-trailing .dsh-st-dropdown-spacer{flex:1 1 auto}
.dsh-st-dropdown-row.has-trailing{gap:0}
.dsh-st-dropdown-row.has-trailing .dsh-st-dropdown-label-cell{margin-right:8px}
.dsh-st-dropdown-row.has-trailing .dsh-st-dropdown-default{margin-right:4px}
.dsh-st-dropdown-check{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;flex:none}
.dsh-st-dropdown-row:hover,.dsh-st-dropdown-row.is-selected{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08));color:var(--dsw-alias-label-primary,inherit)}
.dsh-st-dropdown-default{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;width:auto;min-width:0;height:22px;padding:0 6px;border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));border-radius:999px;background:var(--dsw-alias-bg-layer-3,rgba(255,255,255,.14));color:var(--dsw-alias-label-primary,inherit);font-family:inherit;font-size:12px;line-height:18px;cursor:pointer;white-space:nowrap;overflow:hidden}
.dsh-st-dropdown-default:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.2))}
.dsh-st-dropdown-default:disabled,.dsh-st-dropdown-default.is-on{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.08);color:var(--dsw-alias-label-tertiary,#8b8f98);cursor:default}
.dsh-st-dropdown.dsh-st-dropdown-compact .dsh-st-dropdown-btn{font-size:12px;line-height:18px}
.dsh-st-dropdown-menu.dsh-st-dropdown-compact .dsh-st-dropdown-row{font-size:12px;line-height:18px}
.dsh-st-dropdown-menu.dsh-st-dropdown-compact .dsh-st-dropdown-default{font-size:11px;line-height:16px}
.dsh-st-sort-tick{width:16px;height:16px;flex:none}
.dsh-st-filters{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-left:auto}
.dsh-st-filters>button{height:28px;padding:0 10px;border:0;border-radius:999px;background:rgba(255,255,255,.06);color:inherit;font-size:12px}
.dsh-st-filters>button.is-on{background:rgba(255,255,255,.14)}
.dsh-st-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.dsh-st-card,.dsh-st-empty{position:relative;padding:16px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.03))}
.dsh-st-card{cursor:pointer}
.dsh-st-card:hover{border-color:rgba(75,124,255,.45)}
.dsh-st-card h3,.dsh-st-empty h3{margin:10px 0 6px;font-size:14px;font-weight:500}
.dsh-st-card p,.dsh-st-empty p{margin:0 0 14px;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.dsh-st-card-head{display:flex;align-items:center;justify-content:space-between}
.dsh-st-card-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-top:12px;border-top:1px dashed var(--dsw-alias-border-l2);color:var(--dsw-alias-label-tertiary);font-size:12px}
.dsh-st-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:999px;background:rgba(255,255,255,.06)}
.dsh-st-more{width:28px;height:28px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer}
.dsh-st-menu{position:absolute;top:40px;right:12px;z-index:3;min-width:148px;padding:6px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-base);box-shadow:0 10px 30px rgba(0,0,0,.28)}
.dsh-st-menu button{display:flex;width:100%;align-items:center;gap:8px;padding:8px 10px;border:0;border-radius:8px;background:transparent;color:inherit;cursor:pointer}
.dsh-st-menu button svg{flex:none}
.dsh-st-menu button:hover{background:rgba(255,255,255,.06)}
.dsh-st-menu .is-danger{color:#ff6b6b}
.dsh-st-timeline{display:flex;flex-direction:column;gap:22px;padding-left:10px}
.dsh-st-group{position:relative;padding-left:18px}
.dsh-st-group:before{content:'';position:absolute;top:8px;bottom:0;left:4px;width:1px;background:rgba(255,255,255,.08)}
.dsh-st-group h3{margin:0 0 10px;font-size:13px;font-weight:600}
.dsh-st-run{position:relative;margin:0 0 12px}
.dsh-st-run:after{content:'';position:absolute;top:6px;left:-18px;width:7px;height:7px;border-radius:50%;background:#34c759}
.dsh-st-run.is-failed:after,.dsh-st-run.is-interrupted:after{background:#ff6b6b}
.dsh-st-run.is-queued:after,.dsh-st-run.is-skipped:after,.dsh-st-run.is-cancelled:after{background:#8b8f98}
.dsh-st-run strong{display:block;margin-bottom:4px;font-size:14px}
.dsh-st-run p{display:flex;gap:10px;margin:0;color:var(--dsw-alias-label-tertiary);font-size:12px}
.dsh-st-error{color:#ff6b6b;font-size:12px}
.dsh-st-muted{color:var(--dsw-alias-label-secondary)}
.dsh-st-mask{position:fixed;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;padding:24px;overflow:auto;background:rgba(0,0,0,.45)}.dsh-st-flyout-root{position:absolute;inset:0;z-index:1200;overflow:visible;pointer-events:none}.dsh-st-flyout-root .dsh-st-select-menu,.dsh-st-flyout-root .dsh-st-model-select-menu{pointer-events:auto}
.dsh-st-modal,.dsh-st-modal *{box-sizing:border-box}.dsh-st-modal{display:flex;flex-direction:column;width:min(760px,calc(100vw - 48px));max-width:100%;max-height:min(92vh,900px);overflow:hidden;padding:24px;border:1px solid var(--dsw-alias-border-l2);border-radius:20px;background:var(--dsw-alias-bg-base)}
.dsh-st-confirm-modal,.dsh-st-confirm-modal *{box-sizing:border-box}.dsh-st-confirm-modal{width:min(420px,calc(100vw - 48px));padding:24px;border:1px solid var(--dsw-alias-border-l2);border-radius:18px;background:var(--dsw-alias-bg-base);box-shadow:var(--dsw-shadow-lv3,0 12px 36px rgba(0,0,0,.36))}.dsh-st-confirm-modal h2{margin:0 0 10px;font-size:18px}.dsh-st-confirm-modal p{margin:0 0 8px;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.5}.dsh-st-confirm-modal .dsh-st-confirm-target{color:var(--dsw-alias-label-primary);font-weight:600;overflow-wrap:anywhere}
.dsh-st-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}
.dsh-st-modal-head h2{margin:0 0 4px;font-size:20px}
.dsh-st-field{display:flex;flex-direction:column;gap:6px;margin-bottom:12px;min-width:0;max-width:100%;font-size:13px}.dsh-st-field:has(.dsh-st-prompt-card){flex:1;min-height:0;margin-bottom:10px}
.dsh-st-field input,.dsh-st-field select,.dsh-st-field textarea{width:100%;padding:9px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-1);color:inherit}
.dsh-st-field textarea{min-height:140px;max-width:100%;resize:vertical}
.dsh-st-inline{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.dsh-st-inline select,.dsh-st-inline input{flex:1;min-width:120px}
.dsh-st-weekdays{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}
.dsh-st-weekdays button{min-width:40px;padding:6px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:transparent;color:inherit;cursor:pointer}
.dsh-st-weekdays button.is-on{border-color:#4b7cff;color:#4b7cff}
.dsh-st-check{display:inline-flex;align-items:center;gap:6px;margin:0 0 12px;font-size:12px}
.dsh-st-modal-actions{display:flex;justify-content:flex-end;flex:none;gap:8px;margin-top:8px}
@media(max-width:860px){.dsh-st-toolbar{flex-wrap:wrap}.dsh-st-search{flex-basis:100%;max-width:none}.dsh-st-grid,.dsh-st-example-row{grid-template-columns:1fr}.dsh-st-filters{width:100%;margin:8px 0}}
.dsh-st-select{position:relative;min-width:108px;z-index:1}.dsh-st-select.is-open{z-index:30}
.dsh-st-select.is-wide{min-width:148px}
.dsh-st-select-btn,.dsh-st-field input,.dsh-st-field textarea{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:rgba(255,255,255,.04);color:inherit}
.dsh-st-select-btn{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:36px;width:100%;padding:0 12px;cursor:pointer}
.dsh-st-select.is-pill{width:auto;min-width:0;flex:none}
.dsh-st-select.is-pill .dsh-st-select-btn{width:auto;min-height:28px;height:28px;padding:0 8px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:13px;font-weight:500;gap:6px;white-space:nowrap}
.dsh-st-select.is-pill .dsh-st-select-btn:hover{background:rgba(255,255,255,.06);color:var(--dsw-alias-label-primary)}
.dsh-st-select.is-pill .dsh-st-select-menu,.dsh-st-select-menu.is-composer{min-width:260px}
.dsh-st-select-btn em{width:8px;height:8px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:rotate(45deg) translateY(-2px);opacity:.7}
.dsh-st-select-menu{position:absolute;top:calc(100% + 6px);left:0;z-index:30;min-width:196px;max-height:280px;overflow:auto;padding:6px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:#2a2c31;box-shadow:0 16px 40px rgba(0,0,0,.42)}
.dsh-st-select-menu.is-up{top:auto;bottom:calc(100% + 6px)}
.dsh-st-select-menu.is-end{left:auto;right:0}.dsh-st-select-menu.is-float{position:absolute;z-index:1200;max-height:min(280px,calc(100vh - 24px));box-sizing:border-box}
.dsh-st-menu-row{white-space:nowrap}
.dsh-st-menu-row.is-kv .dsh-st-menu-row-main{flex:none}
.dsh-st-menu-row.is-kv .dsh-st-menu-row-side{flex:1;justify-content:flex-end;min-width:0}
.dsh-st-select-menu button,.dsh-st-menu-row{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:8px 10px;border:0;border-radius:10px;background:transparent;color:inherit;text-align:left;cursor:pointer;font-size:13px}
.dsh-st-menu-row-main{display:inline-flex;align-items:center;gap:8px;min-width:0}
.dsh-st-menu-row-side{display:inline-flex;align-items:center;gap:8px;color:var(--dsw-alias-label-secondary);font-size:12px}
.dsh-st-menu-row-side small{display:block;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary)}
.dsh-st-select-menu button:hover,.dsh-st-menu-row:hover,.dsh-st-menu-row.is-on{background:rgba(255,255,255,.06)}
.dsh-st-tick,.dsh-st-next{width:7px;height:11px;border-right:1.6px solid currentColor;border-bottom:1.6px solid currentColor;flex:none}
.dsh-st-tick{height:12px;width:6px;transform:rotate(45deg) translateY(-2px);border-right-color:#7aa2ff;border-bottom-color:#7aa2ff}
.dsh-st-next{height:7px;transform:rotate(-45deg);opacity:.55}
.dsh-st-select-empty{padding:14px 12px;color:var(--dsw-alias-label-tertiary);font-size:12px;text-align:center}
.dsh-st-chip-btn{display:inline-flex;align-items:center;gap:6px;min-height:28px;height:28px;padding:0 8px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:13px;font-weight:500;white-space:nowrap;cursor:pointer}
.dsh-st-chip-btn:hover{background:rgba(255,255,255,.06);color:var(--dsw-alias-label-primary)}
.dsh-st-chip-btn.is-static{cursor:default;opacity:.78}
.dsh-st-chip-btn em,.dsh-st-select.is-pill .dsh-st-select-btn em{width:6px;height:6px;margin-left:2px;opacity:.55}
.dsh-st-model-select{position:relative;z-index:1;min-width:0;flex:none}.dsh-st-model-select.is-open{z-index:30}.dsh-st-model-select-trigger{display:flex;align-items:center;gap:4px;min-width:0;max-width:260px;height:28px;padding:0 4px 0 8px;border:0;border-radius:24px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:13px;font-weight:500;line-height:20px;cursor:pointer}.dsh-st-model-select-trigger:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.dsh-st-model-select-trigger>span:first-child{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dsh-st-model-trigger-effort{flex:none;color:var(--dsw-alias-label-tertiary);white-space:nowrap}.dsh-st-model-trigger-chevron{flex:none;transition:transform .16s ease}.dsh-st-model-trigger-chevron.is-open{transform:rotate(180deg)}.dsh-st-model-select-menu{z-index:30;width:min(240px,calc(100vw - 32px));max-height:min(360px,calc(100vh - 96px));overflow-y:auto;padding:4px;border:1px solid var(--dsw-alias-border-inverted,var(--dsw-alias-border-l2));border-radius:12px;background:var(--dsw-specific-menu,var(--dsw-alias-bg-base));box-shadow:var(--dsw-shadow-lv3)}.dsh-st-model-select-menu.is-float{position:absolute;z-index:1200;box-sizing:border-box}.dsh-st-model-select-menu .dsh-st-menu-row{min-height:40px;padding:0 10px;border-radius:10px;font-size:14px}.dsh-st-model-select-menu .dsh-st-menu-row.is-kv .dsh-st-menu-row-side{font-size:13px;color:var(--dsw-alias-label-tertiary)}.dsh-st-model-group+.dsh-st-model-group{margin-top:4px}.dsh-st-model-group-title{position:sticky;top:0;z-index:1;padding:5px 8px 3px;background:var(--dsw-specific-menu,var(--dsw-alias-bg-base));color:var(--dsw-alias-label-tertiary);font-size:12px;font-weight:500;line-height:18px}.dsh-st-model-option{display:flex;width:100%;min-height:38px;align-items:center;gap:8px;padding:6px 8px;border:0;border-radius:10px;background:transparent;color:var(--dsw-alias-label-primary);text-align:left;cursor:pointer}.dsh-st-model-option:hover,.dsh-st-model-option:focus-visible{background:var(--dsw-alias-interactive-bg-hover);outline:none}.dsh-st-model-option-copy{display:flex;min-width:0;flex:1;flex-direction:column}.dsh-st-model-name{overflow:hidden;font-size:14px;font-weight:500;line-height:20px;text-overflow:ellipsis;white-space:nowrap}.dsh-st-model-description{overflow:hidden;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;text-overflow:ellipsis;white-space:nowrap}.dsh-st-model-check{display:grid;flex:0 0 18px;place-items:center;color:var(--dsw-alias-label-primary)}.dsh-st-model-warning{margin:4px;padding:8px;border-radius:8px;background:var(--dsw-alias-interactive-bg-hover-danger,rgba(248,81,73,.1));color:var(--dsw-alias-state-error-primary,#f85149);font-size:12px;line-height:18px}.dsh-st-model-empty{padding:14px 12px;color:var(--dsw-alias-label-tertiary);font-size:12px;text-align:center}
.dsh-st-suffix{color:var(--dsw-alias-label-secondary);font-size:13px}
.dsh-st-inline input.is-narrow{width:72px;flex:none}
.dsh-st-time{display:inline-flex;align-items:center;gap:2px;min-height:36px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:rgba(255,255,255,.04)}
.dsh-st-time .dsh-st-select{min-width:48px}
.dsh-st-time .dsh-st-select-btn{width:auto;min-height:32px;padding:0 6px;border:0;background:transparent}
.dsh-st-time-sep{padding:0 2px;color:var(--dsw-alias-label-secondary)}
.dsh-st-inline input[type=date]{min-width:148px;max-width:170px}
.dsh-st-weekdays button{min-width:52px;height:34px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);background:transparent}
.dsh-st-weekdays button.is-on{border-color:transparent;background:#fff;color:#111}
.dsh-st-prompt-card{display:flex;flex-direction:column;flex:1;min-height:160px;max-width:100%;border:1px solid var(--dsw-alias-border-l2);border-radius:22px;overflow:visible;background:rgba(255,255,255,.03)}
.dsh-st-prompt-card textarea{flex:1;width:100%;max-width:100%;min-height:140px;border:0;background:transparent;padding:16px 18px;font-size:14px;line-height:1.65;resize:none}
.dsh-st-composer,.dsh-st-composer-left,.dsh-st-composer-right{display:flex;align-items:center;flex-wrap:nowrap}
.dsh-st-composer{justify-content:space-between;gap:8px;padding:2px 8px 10px;border-top:0}
.dsh-st-composer-left,.dsh-st-composer-right{gap:2px;min-width:0}
.dsh-st-composer .dsh-st-select{min-width:0}
.dsh-st-composer svg{flex:none}
.dsh-st-menu-split{height:1px;margin:6px 8px;background:rgba(255,255,255,.08)}
.dsh-st-subdialog{margin:0 0 12px;padding:12px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:rgba(255,255,255,.03)}
.dsh-st-subdialog>strong{display:block;margin:0 0 8px;font-size:13px}
.dsh-st-rail-views{display:flex;flex:none;gap:3px;margin:16px 8px 10px;padding:2px;border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.1));border-radius:9px;background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.035))}
.dsh-st-rail-views button{flex:1;appearance:none;border:1px solid transparent;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary,#9ca3af);padding:3px 7px;font-size:12px;line-height:18px;cursor:pointer;transition:background .16s ease,border-color .16s ease,color .16s ease,box-shadow .16s ease}
.dsh-st-rail-views button:hover{color:var(--dsw-alias-label-primary,inherit)}
.dsh-st-rail-views button.is-on{border-color:var(--dsw-alias-border-l2,rgba(255,255,255,.18));background:var(--dsw-alias-bg-layer-3,rgba(255,255,255,.15));color:var(--dsw-alias-label-primary,#fff);font-weight:650;box-shadow:0 1px 3px rgba(0,0,0,.34),inset 0 1px rgba(255,255,255,.06)}
.dsh-st-overview{display:flex;flex-direction:column;flex:1;min-height:0;overflow-y:auto;padding:2px 8px 14px}
.dsh-st-overview-head{display:flex;flex:none;align-items:center;justify-content:space-between;gap:8px;height:36px;min-height:36px;margin-bottom:4px;padding:6px 0}
.dsh-st-overview-title{display:flex;align-items:baseline;min-width:0;gap:6px;color:var(--dsw-alias-label-tertiary,#81858C)}
.dsh-st-overview-title strong{font-size:14px;font-weight:400;line-height:20px}
.dsh-st-overview-title span{display:inline-grid;place-items:center;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:var(--dsw-alias-bg-layer-3,rgba(255,255,255,.1));color:var(--dsw-alias-label-tertiary,#8b8f98);font-size:11px;line-height:18px}
.dsh-st-overview-sort{display:flex;align-items:center}
.dsh-st-overview-row{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto 12px;align-items:center;gap:8px;width:100%;min-height:88px;margin:0 0 8px;padding:9px 10px;border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.1));border-radius:9px;background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.035));color:var(--dsw-alias-label-primary,inherit);text-align:left;cursor:pointer;box-shadow:inset 0 1px rgba(255,255,255,.025);transition:background .14s ease,border-color .14s ease}
.dsh-st-overview-row:hover:not(:disabled){border-color:var(--dsw-alias-border-inverted,rgba(255,255,255,.18));background:var(--dsw-alias-bg-layer-3,rgba(255,255,255,.06))}
.dsh-st-overview-row:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4c8dff);outline-offset:2px}
.dsh-st-overview-row:disabled{cursor:default}
.dsh-st-overview-copy{display:flex;flex:1;min-width:0;flex-direction:column;gap:4px}
.dsh-st-overview-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;line-height:18px;font-weight:580}
.dsh-st-overview-status{display:inline-flex;align-self:flex-start;align-items:center;gap:4px;padding:2px 6px;border-radius:999px;background:rgba(50,205,143,.12);color:#45d483;font-size:11px;line-height:16px}
.dsh-st-overview-row.is-paused .dsh-st-overview-status{background:var(--dsw-alias-bg-layer-3,rgba(255,255,255,.08));color:var(--dsw-alias-label-secondary,#aeb3bd)}
.dsh-st-overview-schedule{display:inline-flex;align-items:center;gap:5px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary,#8b8f98);font-size:12px;line-height:16px}
.dsh-st-overview-next{display:flex;flex:none;min-width:50px;flex-direction:column;align-items:flex-end;gap:2px;color:var(--dsw-alias-label-tertiary,#8b8f98);font-size:10px;line-height:14px}
.dsh-st-overview-next strong{color:var(--dsw-alias-label-secondary,#b6bac2);font-size:12px;font-weight:600;line-height:16px;white-space:nowrap}
.dsh-st-overview-row:not(.is-paused) .dsh-st-overview-next strong{color:#45d483}
.dsh-st-overview-chevron{flex:none;color:var(--dsw-alias-label-tertiary,#8b8f98)}
.dsh-st-rail{box-sizing:border-box;height:100%;overflow:auto;padding:4px var(--dsh-sidebar-inline-padding,12px) 18px 8px;color:inherit;scrollbar-gutter:stable}
.dsh-st-rail-empty{padding:16px 10px;color:var(--dsw-alias-label-tertiary,#8b8f98);font-size:12px}
.dsh-st-rail-group{margin:0 0 8px}
.dsh-st-rail-head,.dsh-st-rail-session{display:flex;align-items:center;gap:8px;width:100%;border:0;background:transparent;color:inherit;text-align:left;cursor:pointer}
.dsh-st-rail-head{min-height:32px;padding:4px 8px;border-radius:8px;font-size:13px;font-weight:600}
.dsh-st-rail-session{min-height:28px;padding:3px 8px 3px 28px;border-radius:8px;color:var(--dsw-alias-label-secondary,#9ca39f);font-size:12px}
.dsh-st-rail-head:hover,.dsh-st-rail-session:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.dsh-st-rail-folder{display:grid;place-items:center;width:16px;height:20px;flex:none;opacity:.8}
.dsh-st-rail-title{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-st-rail-session span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-st-rail-dot{width:6px;height:6px;margin-left:auto;border-radius:50%;background:#34c759;flex:none}.dsh-st-run-dot{flex:none;color:var(--dsw-static-deepseek-450,#4c8dff)}.dsh-st-run-dot-cell{fill:currentColor;opacity:.15;animation:dsh-st-run-chase 1s infinite}@keyframes dsh-st-run-chase{0%,12.4%{opacity:1}12.5%,24.9%{opacity:.6}25%,37.4%{opacity:.35}37.5%,100%{opacity:.15}}
.dsh-st-shell-rail{display:flex;flex-direction:column;min-height:0;flex:1;height:100%;overflow:hidden}
.dsh-st-shell-tabs{display:flex;flex:none;gap:18px;padding:6px 12px 0;border-bottom:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.08))}
.dsh-st-shell-tabs button{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary,#8b8f98);padding:8px 0 9px;font-size:13px;cursor:pointer}
.dsh-st-shell-tabs button.is-on{color:var(--dsw-alias-label-primary,inherit);box-shadow:inset 0 -2px 0 currentColor}
.dsh-st-shell-body{display:flex;min-height:0;flex:1;overflow:hidden}
.dsh-st-shell-body>*{min-width:0;flex:1}.dsh-st-official-tree{display:flex;min-height:0;flex:1;overflow:hidden}.dsh-st-official-tree>*{min-width:0;flex:1}
.dsh-st-rail-head.is-static{cursor:default;font-weight:600}
.dsh-st-rail-session.is-on{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.dsh-st-n,.dsh-st-n *{box-sizing:border-box}.dsh-st-n{box-sizing:border-box;display:flex;flex:1;min-width:0;max-width:100%;min-height:0;flex-direction:column;padding:0;padding-right:var(--dsh-sidebar-inline-padding,12px);color:var(--dsw-alias-label-primary,inherit);font:14px/20px inherit;overflow:hidden}.dsh-st-n-toolbar{box-sizing:border-box;flex:none;height:36px;margin:2px -4px 4px 0;padding-left:4px;display:flex;justify-content:flex-end;align-items:center;gap:4px;overflow:visible;position:relative;z-index:2;color:var(--dsw-alias-label-tertiary,#81858C);border-radius:12px}.dsh-st-n-head-label{white-space:nowrap;min-width:0;max-width:45%;flex:none;line-height:20px;font-size:14px;overflow:hidden;transition:max-width .18s var(--ds-ease-in-out,ease),margin-right .18s var(--ds-ease-in-out,ease),opacity .12s var(--ds-ease-in-out,ease),transform .18s var(--ds-ease-in-out,ease),visibility 0s linear}.dsh-st-n-toolbar.is-search .dsh-st-n-head-label{opacity:0;visibility:hidden;max-width:0;margin-right:-4px;transform:translate(-4px);transition-delay:0s,0s,0s,0s,.18s}.dsh-st-n-search-slot{box-sizing:border-box;min-width:28px;max-width:28px;transition:max-width .18s var(--ds-ease-in-out,ease);flex:none;align-items:center;margin-left:auto;display:flex;position:relative;z-index:2}.dsh-st-n-toolbar.is-search .dsh-st-n-search-slot{flex:1;min-width:0;max-width:100%}.dsh-st-n-search{box-sizing:border-box;cursor:text;width:100%;height:28px;color:var(--dsw-alias-label-secondary);transition:width .18s var(--ds-ease-in-out,ease),padding .18s var(--ds-ease-in-out,ease),border-color .18s var(--ds-ease-in-out,ease);background:transparent;border:none;border-radius:50%;flex:none;align-items:center;margin:0;padding:0;display:flex;overflow:hidden}.dsh-st-n-toolbar.is-search .dsh-st-n-search{border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.10));width:calc(100% + 4px);height:30px;border-radius:10px;margin-inline:-2px;padding:0 4px 0 0}.dsh-st-n-search-btn,.dsh-st-n-head-btn{cursor:pointer;width:28px;height:28px;min-width:28px;min-height:28px;position:relative;z-index:1;color:var(--dsw-alias-label-secondary);background:transparent;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.dsh-st-n-toolbar.is-search .dsh-st-n-search-btn{width:28px;height:30px}.dsh-st-n-search-btn:hover,.dsh-st-n-head-btn:hover,.dsh-st-n-head-btn.is-on{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06));color:var(--dsw-alias-label-primary,inherit)}.dsh-st-n-toolbar.is-search .dsh-st-n-search-btn:hover{background:transparent}.dsh-st-n-head-acts{opacity:1;visibility:visible;max-width:32px;transition:max-width .18s var(--ds-ease-in-out,ease),opacity .12s var(--ds-ease-in-out,ease),transform .18s var(--ds-ease-in-out,ease),visibility 0s linear;flex:none;align-items:center;gap:4px;display:flex;overflow:visible;position:relative}.dsh-st-n-toolbar.is-search .dsh-st-n-head-acts{opacity:0;visibility:hidden;pointer-events:none;max-width:0;transform:translate(4px);transition-delay:0s,0s,0s,.18s}.dsh-st-n-head-filter{position:relative}.dsh-st-n-search-input{display:none;opacity:0;pointer-events:none;width:0;min-width:0;flex:none;color:var(--dsw-alias-label-primary,inherit);transition:opacity .12s var(--ds-ease-in-out,ease);background:transparent;border:none;outline:none;flex:1;font-size:13px;line-height:18px}.dsh-st-n-toolbar.is-search .dsh-st-n-search-input{display:block;opacity:1;pointer-events:auto;margin-left:-2px;width:auto;flex:1;min-width:0}.dsh-st-n-search-input::placeholder{color:var(--dsw-alias-label-tertiary,#81858C)}.dsh-st-n-search-clear{cursor:pointer;width:24px;height:24px;color:var(--dsw-alias-label-secondary);background:transparent;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.dsh-st-n-search-clear:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}@media (prefers-reduced-motion:reduce){.dsh-st-n-head-label,.dsh-st-n-search-slot,.dsh-st-n-search,.dsh-st-n-head-acts,.dsh-st-n-search-input{transition:none}}.dsh-st-n-filter-menu{position:absolute;right:0;top:calc(100% + 6px);z-index:30;min-width:196px;padding:8px 6px;border:1px solid var(--dsw-alias-border-inverted,rgba(255,255,255,.12));border-radius:12px;background:var(--dsw-specific-menu,#1c2128);box-shadow:var(--dsw-shadow-lv3,0 8px 24px rgba(0,0,0,.36))}.dsh-st-n-filter-label{padding:6px 10px 4px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#81858C)}.dsh-st-n-filter-split{height:1px;margin:6px 8px;background:var(--dsw-alias-border-l2,rgba(255,255,255,.1))}.dsh-st-n-filter-menu button{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;min-height:36px;padding:6px 10px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary,inherit);font:14px/20px inherit;cursor:pointer;text-align:left}.dsh-st-n-filter-menu button:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}.dsh-st-n-filter-tick{width:16px;height:16px;flex:none}.dsh-st-n-tree{flex:1;min-width:0;max-width:100%;min-height:0;overflow-x:hidden;overflow-y:auto;padding:0 0 16px;user-select:none}.dsh-st-n-empty{padding:14px 8px;color:var(--dsw-alias-label-tertiary,#8b8f98);font-size:12px}.dsh-st-n-group{min-width:0;max-width:100%}.dsh-st-n-row,.dsh-st-n-sess{display:flex;align-items:center;max-width:100%;border-radius:8px;padding:0 8px 0 12px;cursor:pointer;border:0;background:transparent;color:var(--dsw-alias-label-primary,inherit);text-align:left;font:14px/20px inherit}.dsh-st-n-row{height:34px;gap:6px}.dsh-st-n-sess{height:32px;gap:0;position:relative;width:100%;appearance:none}.dsh-st-n-row:hover,.dsh-st-n-sess:hover,.dsh-st-n-sess.is-on,.dsh-st-n-sess.is-menu{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}.dsh-st-n-slot{flex:none;width:16px;height:20px;display:inline-flex;align-items:center;justify-content:center}.dsh-st-n-folder{color:var(--dsw-alias-label-secondary,#9ca39f)}.dsh-st-n-lead{color:var(--dsw-alias-label-tertiary,#81858C)}.dsh-st-n-corner{color:var(--dsw-alias-label-caption,#ADB2B8);width:8px}.dsh-st-n-title{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;line-height:20px}.dsh-st-n-sess .dsh-st-n-title{margin:0 6px 0 4px}.dsh-st-n-time{flex:none;font-size:12px;line-height:20px;color:var(--dsw-alias-label-tertiary,#81858C);white-space:nowrap}.dsh-st-n-acts{flex:none;display:none;align-items:center;gap:12px}.dsh-st-n-row:hover .dsh-st-n-acts,.dsh-st-n-sess:hover .dsh-st-n-acts,.dsh-st-n-row.is-menu .dsh-st-n-acts,.dsh-st-n-sess.is-menu .dsh-st-n-acts{display:inline-flex}.dsh-st-n-sess:hover .dsh-st-n-time,.dsh-st-n-sess.is-menu .dsh-st-n-time{display:none}.dsh-st-n-ico{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border:0;border-radius:4px;background:transparent;color:var(--dsw-alias-label-tertiary,#81858C);padding:0;cursor:pointer}.dsh-st-n-ico:hover{color:var(--dsw-alias-label-primary,inherit)}.dsh-st-n-menu.is-float{position:fixed;z-index:4000;right:auto;top:auto}.dsh-st-n-menu{position:absolute;right:8px;top:calc(100% + 4px);z-index:1100;min-width:218px;max-width:360px;box-sizing:border-box;padding:4px;display:flex;flex-direction:column;border:1px solid var(--dsw-alias-border-inverted,rgba(255,255,255,.12));border-radius:12px;background:var(--dsw-specific-menu,#1c2128);box-shadow:var(--dsw-shadow-lv3,0 8px 24px rgba(0,0,0,.36))}.dsh-st-n-menu button{display:flex;align-items:center;gap:8px;width:100%;min-height:40px;padding:8px 10px;border:0;border-radius:10px;background:transparent;cursor:pointer;font-size:14px;line-height:22px;color:var(--dsw-alias-label-primary,inherit);text-align:left}.dsh-st-n-menu button:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}.dsh-st-n-mi{display:inline-flex;flex:none;width:16px;height:16px;align-items:center;justify-content:center;color:var(--dsw-alias-label-tertiary,#81858C)}.dsh-st-n-menu button.danger{color:var(--dsw-alias-state-error-primary,#f85149)}.dsh-st-n-menu button.danger .dsh-st-n-mi{color:inherit}.dsh-st-n-menu button.danger:hover{background:var(--dsw-alias-interactive-bg-hover-danger,rgba(248,81,73,.12))}.dsh-st-n-hover{position:fixed;z-index:4100;min-width:188px;max-width:280px;padding:12px 14px;border:1px solid var(--dsw-alias-border-inverted,rgba(255,255,255,.12));border-radius:12px;background:var(--dsw-specific-menu,#1c2128);box-shadow:var(--dsw-shadow-lv3,0 8px 24px rgba(0,0,0,.36));color:var(--dsw-alias-label-primary,inherit)}.dsh-st-n-hover-title{font-size:14px;line-height:20px;font-weight:500}.dsh-st-n-hover-time{margin-top:4px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#81858C)}.dsh-st-n-hover-state{display:flex;align-items:center;gap:6px;margin-top:8px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,#9ca39f)}.dsh-st-n-hover-dot{width:8px;height:8px;border-radius:50%;background:#34c759;flex:none}.dsh-st-n-hover-dot.is-run{background:#4c8dff}.dsh-st-n-rename{flex:1;min-width:0;margin:0 6px 0 4px;border:1px solid var(--dsw-alias-border-l2);border-radius:4px;background:var(--dsw-alias-button-elevated-fill,rgba(255,255,255,.04));color:inherit;font:inherit;padding:0 2px}
.dsh-st-n-row.is-menu{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.dsh-st-overview-sort .dsh-st-n-head-btn.is-open{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06));color:var(--dsw-alias-label-primary,inherit)}
.dsh-st-n-row[aria-expanded="true"].has-current-session .dsh-st-n-folder{color:var(--dsw-static-deepseek-450,#4c8dff)}
.dsh-st-n-sess:focus{outline:none}.dsh-st-n-sess:focus-visible:not(.is-on){box-shadow:inset 0 0 0 2px var(--dsw-alias-state-business-primary,#4c8dff)}
.dsh-st-n-row>.dsh-st-n-acts{display:inline-flex;opacity:0;visibility:hidden;pointer-events:none}
.dsh-st-n-row:hover>.dsh-st-n-acts,.dsh-st-n-row:focus-within>.dsh-st-n-acts,.dsh-st-n-row.is-menu>.dsh-st-n-acts{opacity:1;visibility:visible;pointer-events:auto}
.dsh-st-n-dialog-actions{display:flex;justify-content:flex-end;gap:8px}
.dsh-st-n-dialog-copy{margin:0;color:var(--dsw-alias-label-secondary);font-size:14px;line-height:22px}
.dsh-st-n-dialog-status{margin-top:12px;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px}
.dsh-st-n-dialog-error{margin-top:12px;color:var(--dsw-alias-state-error-primary,#f85149);font-size:13px;line-height:20px}
.dsh-st-n-danger-button{color:var(--dsw-alias-state-error-primary,#f85149)!important}
.dsh-st-n-danger-button:hover{background:var(--dsw-alias-interactive-bg-hover-danger,rgba(248,81,73,.12))!important}
.dsh-st-n-status-dot{width:8px;height:8px;border-radius:50%;background:#34c759;display:block;flex:none}.dsh-st-n-status-dot.is-error{background:#ff5f57}
.dsh-st-n-hover-dot{background:#f2c94c}.dsh-st-n-hover-dot.is-run{background:#34c759}
.dsh-st-n-hover-schedule{display:flex;flex-direction:column;align-items:flex-start;gap:6px;margin-top:10px;padding-top:10px;border-top:1px dashed var(--dsw-alias-border-l2,rgba(255,255,255,.1));font-size:12px;line-height:18px}.dsh-st-n-hover-schedule .dsh-st-chip{min-width:0;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dsh-st-n-hover-schedule .dsh-st-n-hover-time{width:100%;text-align:left}
.dsh-st-n-head-acts{max-width:64px}
`

export function installStyles(): () => void {
  const existing = document.getElementById(STYLE_ID)
  if (existing instanceof HTMLStyleElement) {
    existing.textContent = CSS_TEXT
    return () => undefined
  }
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = CSS_TEXT
  document.head.append(style)
  return () => { style.remove() }
}
