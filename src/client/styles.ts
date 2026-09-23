const STYLE_ID = 'dsh-automation-styles'

const CSS_TEXT = `
.dsh-st-shell{container-type:inline-size;min-width:0;box-sizing:border-box;max-width:1080px;width:100%;margin:0 auto;padding:0 0 32px;color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family,system-ui)}
.dsh-st-top{display:flex;flex-direction:column;align-items:stretch;gap:12px;margin-bottom:12px}
.dsh-st-heading h1,.dsh-st-top h1{margin:0;font-size:24px;line-height:32px;font-weight:600;letter-spacing:-.4px;white-space:nowrap}
.dsh-st-heading-row{display:flex;align-items:center;gap:8px;min-width:0;flex-wrap:wrap}.dsh-st-heading-links{display:inline-flex;align-items:center;gap:8px;min-width:0;flex-wrap:wrap}
.dsh-st-heading p,.dsh-st-top p{margin:12px 0 0;max-width:none;color:var(--dsw-alias-label-tertiary);font-size:14px;line-height:22px}
.dsh-st-toolbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-start;gap:8px}
.dsh-st-search{flex:1;min-width:0;max-width:280px}
.dsh-st-banner{display:flex;align-items:flex-start;gap:8px;margin-bottom:16px;padding:10px 14px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.5}
.dsh-st-banner>span{display:inline-flex;align-items:flex-start;gap:8px}
.dsh-st-examples{margin-bottom:22px}
.dsh-st-examples-head h2{margin:0 0 10px;font-size:13px;font-weight:600;color:var(--dsw-alias-label-secondary)}
.dsh-st-example-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.dsh-st-example{display:flex;flex-direction:column;align-items:flex-start;gap:8px;min-height:132px;padding:14px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.03));color:inherit;text-align:left;cursor:pointer}
.dsh-st-example:hover{border-color:rgba(75,124,255,.45)}
.dsh-st-example strong{font-size:14px}
.dsh-st-example p{margin:0;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.dsh-st-tabs{display:flex;align-items:center;justify-content:space-between;gap:16px;height:40px;margin:4px 0 16px;flex-wrap:nowrap;border-bottom:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.12))}
.dsh-st-settings-tabs{flex:0 0 auto;width:max-content;min-width:max-content;height:40px}
.dsh-st-settings-tabs.ant-tabs{width:max-content!important}
.dsh-st-settings-tabs .ant-tabs-nav,.dsh-st-settings-tabs .ant-tabs-nav-wrap{overflow:visible}
.dsh-st-settings-tabs .ant-tabs-nav-operations{display:none}
.dsh-st-settings-tabs .ant-tabs-nav{margin:0;height:40px}
.dsh-st-settings-tabs .ant-tabs-nav::before{border-bottom:0}
.dsh-st-settings-tabs .ant-tabs-tab{height:40px;padding:0;display:flex;align-items:center}
.dsh-st-settings-tabs .ant-tabs-tab-btn{color:var(--dsw-alias-label-secondary);font-size:14px;line-height:22px}
.dsh-st-settings-tabs .ant-tabs-tab-active .ant-tabs-tab-btn{color:var(--dsw-alias-label-primary);font-weight:600}
.dsh-st-settings-tabs .ant-tabs-ink-bar{background:var(--dsw-alias-label-primary)}
.dsh-st-sort-wrap,.dsh-st-filters{display:flex;align-items:center;align-self:center;justify-content:flex-end;gap:8px;height:32px;margin:0 0 0 auto;min-width:0;flex:1 1 auto;flex-wrap:nowrap}
.dsh-st-sort-select{width:168px;max-width:100%}
.dsh-st-sort-default{display:block;width:100%;margin:4px 0 0;padding:6px 12px;border:0;border-top:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.12));background:transparent;color:inherit;text-align:left;cursor:pointer}
.dsh-st-sort-default:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.dsh-st-sort-default:disabled{opacity:.55;cursor:default}
.dsh-st-filters .ant-select{min-width:0}
.dsh-st-filter-range,.dsh-st-filter-status{width:112px;flex:0 0 112px}
.dsh-st-filter-task{width:200px;max-width:240px;flex:0 1 240px;min-width:120px}
.dsh-st-filters .ant-select-content,.dsh-st-filters .ant-select-selector,.dsh-st-sort-select .ant-select-content,.dsh-st-sort-select .ant-select-selector{min-width:0;overflow:hidden}
.dsh-st-filters .ant-select-selection-item,.dsh-st-sort-select .ant-select-selection-item{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-st-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.dsh-st-card,.dsh-st-empty{position:relative;padding:16px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.03))}
.dsh-st-card{cursor:pointer}
.dsh-st-card:hover{border-color:rgba(75,124,255,.45)}
.dsh-st-card h3,.dsh-st-empty h3{margin:10px 0 6px;font-size:14px;font-weight:500}
.dsh-st-card p,.dsh-st-empty p{margin:0 0 14px;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.dsh-st-card-head{display:flex;align-items:center;justify-content:space-between}
.dsh-st-card-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-top:12px;border-top:1px dashed var(--dsw-alias-border-l2);color:var(--dsw-alias-label-tertiary);font-size:12px}
.dsh-st-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:999px;background:rgba(255,255,255,.06)}
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
.dsh-st-form{display:flex;flex-direction:column;gap:12px}.dsh-st-form>p{margin:0;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.5}
.dsh-st-field{display:flex;flex-direction:column;gap:6px;min-width:0;max-width:100%;font-size:13px}
.dsh-st-field>.ant-input,.dsh-st-field>.ant-input-affix-wrapper,.dsh-st-field>.ant-input-textarea{width:100%}
.dsh-st-plan-row{display:flex;align-items:flex-start;gap:16px}.dsh-st-plan-row>.dsh-st-field:first-child{flex:1;min-width:0}.dsh-st-concurrency{flex:0 0 128px}
.dsh-st-inline{display:flex;flex-wrap:wrap;align-items:center;gap:8px}.dsh-st-inline>.ant-select{flex:0 1 180px;width:auto;min-width:120px}
.dsh-st-time{display:inline-flex;align-items:center;gap:6px;flex:none}.dsh-st-time .ant-select{width:88px;flex:none}.dsh-st-time-sep{color:var(--dsw-alias-label-secondary)}
.dsh-st-suffix{color:var(--dsw-alias-label-secondary);font-size:13px;white-space:nowrap}
.dsh-st-prompt-card{display:flex;flex-direction:column;flex:none;border:1px solid var(--dsw-alias-border-l2);border-radius:16px;background:rgba(255,255,255,.03);overflow:hidden}
.dsh-st-prompt-card textarea{padding:14px 16px 8px;font-size:14px;line-height:1.65;resize:none}
.dsh-st-composer{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 8px 6px}
.dsh-st-composer-left,.dsh-st-composer-right{display:flex;align-items:center;gap:2px;min-width:0}
.dsh-st-composer-left{flex:1}.dsh-st-composer-right{flex:none}
.dsh-st-composer .ant-select{width:auto;max-width:200px}.dsh-st-composer .ant-btn{flex:none}
@media(max-width:860px){.dsh-st-toolbar{flex-wrap:wrap}.dsh-st-search{flex-basis:100%;max-width:none}.dsh-st-grid,.dsh-st-example-row{grid-template-columns:1fr}.dsh-st-filters{width:100%;margin:8px 0}}
.dsh-st-rail-views{margin:16px 8px 10px}
.dsh-st-overview{display:flex;flex-direction:column;flex:1;min-height:0;overflow-y:auto;padding:2px 8px 14px}
.dsh-st-overview-head{display:flex;flex:none;align-items:center;justify-content:space-between;gap:8px;height:36px;min-height:36px;margin-bottom:4px;padding:6px 0}
.dsh-st-overview-title{display:flex;align-items:baseline;min-width:0;gap:6px;color:var(--dsw-alias-label-tertiary,#81858C)}
.dsh-st-overview-title strong{font-size:14px;font-weight:400;line-height:20px}
.dsh-st-overview-title span{display:inline-grid;place-items:center;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:var(--dsw-alias-bg-layer-3,rgba(255,255,255,.1));color:var(--dsw-alias-label-tertiary,#8b8f98);font-size:11px;line-height:18px}
.dsh-st-overview-sort{display:flex;align-items:center}
.dsh-st-overview-row{position:relative;width:100%;min-height:56px;margin:0 0 8px;border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.1));border-radius:9px;background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.035));color:var(--dsw-alias-label-primary,inherit);box-shadow:inset 0 1px rgba(255,255,255,.025);transition:background .14s ease,border-color .14s ease;overflow:hidden}
.dsh-st-overview-row:hover{border-color:var(--dsw-alias-border-inverted,rgba(255,255,255,.18));background:var(--dsw-alias-bg-layer-3,rgba(255,255,255,.06))}
.dsh-st-overview-open{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:18px 18px;align-items:center;gap:4px 8px;width:100%;min-height:56px;padding:8px 9px;border:0;background:transparent;color:inherit;text-align:left;cursor:pointer}
.dsh-st-overview-open:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4c8dff);outline-offset:-2px}
.dsh-st-overview-open:disabled{cursor:default}
.dsh-st-overview-copy{display:contents}
.dsh-st-overview-name{box-sizing:border-box;grid-column:1/3;grid-row:1;min-width:0;padding-right:44px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;line-height:18px;font-weight:580}
.dsh-st-overview-schedule{display:inline-flex;grid-column:1;grid-row:2;align-items:center;gap:5px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary,#8b8f98);font-size:12px;line-height:16px}
.dsh-st-overview-schedule svg{flex:none}
.dsh-st-overview-schedule>span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-st-overview-next{display:inline-flex;grid-column:2;grid-row:2;justify-self:end;flex:none;min-width:0;align-items:center;color:var(--dsw-alias-label-tertiary,#8b8f98);line-height:16px;white-space:nowrap}
.dsh-st-overview-next strong{color:var(--dsw-alias-label-secondary,#b6bac2);font-size:12px;font-weight:600;line-height:16px;white-space:nowrap}
.dsh-st-overview-row:not(.is-paused) .dsh-st-overview-next strong{color:#45d483}
.dsh-st-overview-toggle{position:absolute;top:4px;right:6px;z-index:1;display:inline-flex;align-items:center}
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
.dsh-st-run-dot{flex:none;color:var(--dsw-static-deepseek-450,#4c8dff)}.dsh-st-run-dot-cell{fill:currentColor;opacity:.15;animation:dsh-st-run-chase 1s infinite}@keyframes dsh-st-run-chase{0%,12.4%{opacity:1}12.5%,24.9%{opacity:.6}25%,37.4%{opacity:.35}37.5%,100%{opacity:.15}}
.dsh-st-shell-rail{display:flex;flex-direction:column;min-height:0;flex:1;height:100%;overflow:hidden}
.dsh-st-shell-tabs{display:flex;flex:none;gap:18px;padding:6px 12px 0;border-bottom:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.08))}
.dsh-st-shell-tabs button{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary,#8b8f98);padding:8px 0 9px;font-size:13px;cursor:pointer}
.dsh-st-shell-tabs button.is-on{color:var(--dsw-alias-label-primary,inherit);box-shadow:inset 0 -2px 0 currentColor}
.dsh-st-shell-body{display:flex;min-height:0;flex:1;overflow:hidden}
.dsh-st-shell-body>*{min-width:0;flex:1}.dsh-st-official-tree{display:flex;min-height:0;flex:1;overflow:hidden}.dsh-st-official-tree>*{min-width:0;flex:1}
.dsh-st-rail-head.is-static{cursor:default;font-weight:600}
.dsh-st-rail-session.is-on{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.dsh-st-n,.dsh-st-n *{box-sizing:border-box}.dsh-st-n{--dsh-session-list-edge-inset:var(--dsh-sidebar-inline-padding,12px);--dsh-session-list-scrollbar-width:5px;--dsh-session-list-scrollbar-offset:2px;box-sizing:border-box;display:flex;flex:1;min-width:0;min-height:0;flex-direction:column;padding:0;padding-right:var(--dsh-session-list-edge-inset);color:var(--dsw-alias-label-primary,inherit);font:14px/20px inherit;overflow:hidden}.dsh-st-n-toolbar{box-sizing:border-box;flex:none;height:36px;margin:2px -4px 4px 0;padding-left:4px;display:flex;justify-content:flex-end;align-items:center;gap:4px;overflow:visible;position:relative;z-index:2;color:var(--dsw-alias-label-tertiary,#81858C);border-radius:12px}.dsh-st-n-head-label{white-space:nowrap;min-width:0;max-width:45%;flex:none;line-height:20px;font-size:14px;overflow:hidden;transition:max-width .18s var(--ds-ease-in-out,ease),margin-right .18s var(--ds-ease-in-out,ease),opacity .12s var(--ds-ease-in-out,ease),transform .18s var(--ds-ease-in-out,ease),visibility 0s linear}.dsh-st-n-toolbar.is-search .dsh-st-n-head-label{opacity:0;visibility:hidden;max-width:0;margin-right:-4px;transform:translate(-4px);transition-delay:0s,0s,0s,0s,.18s}.dsh-st-n-search-slot{box-sizing:border-box;min-width:28px;max-width:28px;transition:max-width .18s var(--ds-ease-in-out,ease);flex:none;align-items:center;margin-left:auto;display:flex;position:relative;z-index:2}.dsh-st-n-toolbar.is-search .dsh-st-n-search-slot{flex:1;min-width:0;max-width:100%}.dsh-st-n-search{box-sizing:border-box;cursor:text;width:100%;height:28px;color:var(--dsw-alias-label-secondary);transition:width .18s var(--ds-ease-in-out,ease),padding .18s var(--ds-ease-in-out,ease),border-color .18s var(--ds-ease-in-out,ease);background:transparent;border:none;border-radius:50%;flex:none;align-items:center;margin:0;padding:0;display:flex;overflow:hidden}.dsh-st-n-toolbar.is-search .dsh-st-n-search{border:.5px solid var(--dsw-alias-border-l4);width:calc(100% + 4px);height:30px;color:var(--dsw-alias-label-caption);border-radius:10px;margin-inline:-2px;padding:0 4px 0 0}.dsh-st-n-search-btn,.dsh-st-n-head-btn{cursor:pointer;width:28px;height:28px;min-width:28px;min-height:28px;position:relative;z-index:1;color:var(--dsw-alias-label-secondary);background:transparent;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.dsh-st-n-toolbar.is-search .dsh-st-n-search-btn{width:28px;height:30px}.dsh-st-n-search-btn:hover,.dsh-st-n-head-btn:hover,.dsh-st-n-head-btn.is-on{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06));color:var(--dsw-alias-label-primary,inherit)}.dsh-st-n-toolbar.is-search .dsh-st-n-search-btn:hover{background:transparent}.dsh-st-n-head-acts{opacity:1;visibility:visible;max-width:32px;transition:max-width .18s var(--ds-ease-in-out,ease),opacity .12s var(--ds-ease-in-out,ease),transform .18s var(--ds-ease-in-out,ease),visibility 0s linear;flex:none;align-items:center;gap:4px;display:flex;overflow:visible;position:relative}.dsh-st-n-toolbar.is-search .dsh-st-n-head-acts{opacity:0;visibility:hidden;pointer-events:none;max-width:0;transform:translate(4px);transition-delay:0s,0s,0s,.18s}.dsh-st-n-search-input{display:none;opacity:0;pointer-events:none;width:0;min-width:0;flex:none;color:var(--dsw-alias-label-primary,inherit);transition:opacity .12s var(--ds-ease-in-out,ease);background:transparent;border:none;outline:none;flex:1;font-size:13px;line-height:18px}.dsh-st-n-toolbar.is-search .dsh-st-n-search-input{display:block;opacity:1;pointer-events:auto;margin-left:-2px;width:auto;flex:1;min-width:0}.dsh-st-n-search-input::placeholder{color:var(--dsw-alias-label-tertiary,#81858C)}.dsh-st-n-search-clear{cursor:pointer;width:24px;height:24px;color:var(--dsw-alias-label-secondary);background:transparent;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.dsh-st-n-search-clear:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}@media (prefers-reduced-motion:reduce){.dsh-st-n-head-label,.dsh-st-n-search-slot,.dsh-st-n-search,.dsh-st-n-head-acts,.dsh-st-n-search-input{transition:none}}.dsh-st-n-list-area{min-height:0;margin-left:-4px;margin-right:calc(-1 * var(--dsh-session-list-edge-inset));flex-direction:column;flex:1;padding-left:4px;display:flex;overflow:visible}.dsh-st-n-tree{flex:1;min-width:0;min-height:0;overflow-x:hidden;overflow-y:auto;user-select:none;margin-left:-4px;margin-right:var(--dsh-session-list-scrollbar-offset);padding-top:0;padding-bottom:16px;padding-left:4px;padding-right:calc(var(--dsh-session-list-edge-inset) - var(--dsh-session-list-scrollbar-width) - var(--dsh-session-list-scrollbar-offset));scrollbar-gutter:stable}.dsh-st-n-empty{padding:16px 12px;color:var(--dsw-alias-label-tertiary,#8b8f98);font-size:13px}.dsh-st-n-group{position:relative;min-width:0;max-width:100%}.dsh-st-n-row,.dsh-st-n-sess{display:flex;align-items:center;max-width:100%;border-radius:8px;padding:0 8px;padding-inline-start:calc(8px + var(--dsh-workspace-indent,0px));cursor:pointer;user-select:none;border:0;background:transparent;color:var(--dsw-alias-label-primary,inherit);text-align:left;font:14px/20px inherit;gap:6px}.dsh-st-n-row{height:34px;gap:6px}.dsh-st-n-sess{height:32px;gap:0;position:relative;width:100%;appearance:none}.dsh-st-n-row:hover,.dsh-st-n-sess:hover,.dsh-st-n-sess.is-on,.dsh-st-n-sess.is-menu{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}.dsh-st-n-slot{flex:none;width:16px;height:20px;color:var(--dsw-alias-label-tertiary,#81858C);display:inline-flex;align-items:center;justify-content:center}.dsh-st-n-folder{color:inherit}.dsh-st-n-title{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;line-height:20px}.dsh-st-n-sess .dsh-st-n-title{margin:0 6px 0 4px;flex:1}.dsh-st-n-sess.is-flat-idle .dsh-st-n-title{margin-left:0}@media (hover:hover){.dsh-st-n-sess:hover .dsh-st-n-title,.dsh-st-n-sess.is-menu .dsh-st-n-title{text-overflow:clip}}.dsh-st-n-time{flex:none;font-size:10px;line-height:16px;color:var(--dsw-alias-label-caption,#ADB2B8);white-space:nowrap}.dsh-st-n-acts{flex:none;display:none;align-items:center;gap:10px}.dsh-st-n-row:hover .dsh-st-n-acts,.dsh-st-n-sess:hover .dsh-st-n-acts,.dsh-st-n-row.is-menu .dsh-st-n-acts,.dsh-st-n-sess.is-menu .dsh-st-n-acts{display:inline-flex}.dsh-st-n-sess:hover .dsh-st-n-time,.dsh-st-n-sess.is-menu .dsh-st-n-time{display:none}.dsh-st-n-ico{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border:0;border-radius:4px;background:transparent;color:var(--dsw-alias-label-tertiary,#81858C);padding:0;cursor:pointer}.dsh-st-n-ico:hover{color:var(--dsw-alias-label-primary,inherit)}.dsh-st-n-hover{position:fixed;z-index:4100;box-sizing:border-box;display:flex;flex-direction:column;gap:8px;width:244px;padding:12px 16px;border:0;border-radius:12px;background:#2C2C2E;box-shadow:var(--dsw-shadow-lv3,0 8px 24px rgba(0,0,0,.36));color:#fff}.dsh-st-n-hover-title{overflow-wrap:break-word;font-size:14px;line-height:20px;font-weight:400;color:#fff}.dsh-st-n-hover-time{font-size:12px;line-height:16px;color:#cfd3d6}.dsh-st-n-hover-state{display:flex;align-items:center;gap:8px;font-size:12px;line-height:20px;color:#adb2b8}.dsh-st-n-rename{flex:1;min-width:0;margin:0 6px 0 4px;border:.5px solid var(--dsw-alias-border-l4);border-radius:4px;outline:none;background:var(--dsw-alias-button-elevated-fill,rgba(255,255,255,.04));color:inherit;padding:0 2px;font-size:14px;line-height:20px}
.dsh-st-n-group>*+*{margin-top:2px}
.dsh-st-n-group+.dsh-st-n-group{margin-top:4px}
.dsh-st-n-row{box-sizing:border-box}
.dsh-st-n-row .dsh-st-n-acts{height:20px}
.dsh-st-n-row.is-menu{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}
.dsh-st-n-row.has-current-session .dsh-st-n-folder{color:var(--dsw-alias-state-business-primary,#4c8dff)}
.dsh-st-n-chevron{display:none;color:var(--dsw-alias-label-caption,#ADB2B8)}
.dsh-st-n-row:hover .dsh-st-n-chevron{display:inline-flex}
.dsh-st-n-row:hover .dsh-st-n-folder{display:none}
.dsh-st-n-arrow{transition:transform .15s var(--ds-ease-in-out,ease)}
.dsh-st-n-arrow.is-open{transform:rotate(90deg)}
.dsh-st-n-project-text{flex-direction:column;flex:1;gap:2px;min-width:0;display:flex}
.dsh-st-n-sess:focus{outline:none}.dsh-st-n-sess:focus-visible:not(.is-on){box-shadow:inset 0 0 0 2px var(--dsw-alias-state-business-primary,#4c8dff)}
.dsh-st-n-dialog-actions{display:flex;justify-content:flex-end;gap:8px}
.dsh-st-n-dialog-copy{margin:0;color:var(--dsw-alias-label-secondary);font-size:14px;line-height:22px}
.dsh-st-n-dialog-status{margin-top:12px;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px}
.dsh-st-n-dialog-error{margin-top:12px;color:var(--dsw-alias-state-error-primary,#f85149);font-size:13px;line-height:20px}
.dsh-st-n-danger-button{color:var(--dsw-alias-state-error-primary,#f85149)!important}
.dsh-st-n-danger-button:hover{background:var(--dsw-alias-interactive-bg-hover-danger,rgba(248,81,73,.12))!important}
.dsh-st-n-restore{flex:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary,#c9cdd4);font:12px/16px inherit;padding:2px 4px;cursor:pointer}
.dsh-st-n-sess.is-archived .dsh-st-n-title,.dsh-st-n-sess.is-archived .dsh-st-n-time{color:var(--dsw-alias-label-caption,#ADB2B8)}
.dsh-st-n-sess .dsh-st-n-title[data-scrolled]{mask-image:linear-gradient(90deg,#0000,#000 12px)}
.dsh-st-n-sess .dsh-st-n-title[data-clipped]{mask-image:linear-gradient(270deg,#0000,#000 12px)}
.dsh-st-n-sess .dsh-st-n-title[data-scrolled][data-clipped]{mask-image:linear-gradient(90deg,#0000,#000 12px calc(100% - 12px),#0000)}
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
