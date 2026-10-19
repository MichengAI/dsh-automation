const STYLE_ID = 'dsh-automation-styles'
const STYLE_OWNER = '@michengai/dsh-automation'

const CSS_TEXT = `
/* 设置导航图标：隐藏宿主 svg，改用独立宿主图标元素，避免改写宿主图标内容。 */
[data-dsh-schedule-nav="1"]>svg{display:none!important}
.dsh-st-nav-icon-schedule{display:inline-flex;align-items:center;justify-content:center;flex:none;width:16px;height:16px}
.dsh-st-nav-icon-schedule svg{display:block}
.dsh-st-shell{container-type:inline-size;min-width:0;box-sizing:border-box;width:100%;padding:0 0 32px;color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family,system-ui)}
.dsh-st-top{display:flex;flex-direction:column;align-items:stretch;gap:12px;margin-bottom:12px}
.dsh-st-heading h1,.dsh-st-top h1{margin:0;font-size:24px;line-height:32px;font-weight:600;letter-spacing:-.4px;white-space:nowrap}
.dsh-st-heading-row{display:flex;align-items:center;gap:8px 12px;min-width:0;flex-wrap:wrap}
.dsh-st-heading-links{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.dsh-st-heading-links>span[data-mpi-check]{display:inline-flex;align-items:center}
.dsh-st-heading p,.dsh-st-top p{margin:12px 0 0;max-width:none;color:var(--dsw-alias-label-tertiary);font-size:14px;line-height:22px}
.dsh-st-toolbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-start;gap:8px}
.dsh-st-search{flex:1;min-width:0;max-width:280px}
.dsh-st-banner{display:flex;align-items:flex-start;gap:8px;margin-bottom:16px;padding:10px 14px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.5}
.dsh-st-banner>span{display:inline-flex;align-items:flex-start;gap:8px}
.dsh-st-examples{margin-bottom:22px}
.dsh-st-examples-head h2{margin:0 0 10px;font-size:13px;font-weight:600;color:var(--dsw-alias-label-secondary)}
.dsh-st-example-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.dsh-st-example{display:flex;flex-direction:column;align-items:flex-start;gap:8px;min-height:132px;padding:14px;border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md,12px);background:var(--dsw-alias-bg-layer-2);color:inherit;text-align:left;cursor:pointer;transition:border-color .15s ease,background .15s ease}
.dsh-st-example:hover{border-color:var(--dsw-alias-border-inverted,rgba(255,255,255,.18));background:var(--dsw-alias-bg-layer-3)}
.dsh-st-example strong{font-size:14px}
.dsh-st-example p{margin:0;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.dsh-st-tabs{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:40px;margin:4px 0 16px;flex-wrap:nowrap}
/* 设置页签固定两项，几何必须与 32px 高对齐右侧排序/筛选控件：
   容器用 inset box-shadow 画 0.5px 描边而非 border，避免 0.5px 边框占用布局高度，
   使 border-box 32px − padding 2×2 = 28px 恰好等于页签与指示器内高。
   宿主指示器宽度按 padding 4px 写死为 calc((100% - 8px) / n)，这里改成 2px 内边距后
   必须同步覆盖为 calc((100% - 4px) / 2)，否则指示器比页签窄 2px，第二项还会累积偏移。
   选择器依赖原语结构（首个子元素为 aria-hidden 指示器），升级 primitives 时需复核。 */
.dsh-st-settings-tabs{flex:0 0 auto;box-sizing:border-box !important;height:32px !important;min-height:32px !important;max-height:32px !important;padding:2px !important;border-radius:var(--dsw-radius-sm,8px) !important;box-shadow:inset 0 0 0 0.5px var(--dsw-alias-border-l2) !important;background:var(--dsw-alias-bg-layer-1) !important}
.dsh-st-settings-tabs>span[aria-hidden="true"],.dsh-st-settings-tabs>[class*="indicator"]{width:calc((100% - 4px) / 2) !important;inset:2px auto 2px 2px !important;border-radius:6px !important;border:0.5px solid var(--dsw-alias-border-l3,rgba(255,255,255,.12)) !important;background:var(--dsw-alias-bg-layer-3,rgba(255,255,255,.08)) !important;box-shadow:none !important}
.dsh-st-settings-tabs [role=tab]{display:inline-flex !important;align-items:center !important;justify-content:center !important;gap:6px !important;height:28px !important;padding:0 12px !important;border-radius:6px !important;font-size:13px !important;line-height:20px !important;color:var(--dsw-alias-label-secondary) !important;text-align:center !important;box-sizing:border-box !important;transition:color 150ms ease !important}
.dsh-st-settings-tabs [role=tab]:hover{color:var(--dsw-alias-label-primary) !important}
.dsh-st-settings-tabs [role=tab][aria-selected="true"]{color:var(--dsw-alias-label-primary) !important;font-weight:600 !important}
.dsh-st-tab-label{display:inline-flex;align-items:center;justify-content:center;gap:6px}
.dsh-st-tab-label svg{flex:none;display:block}
.dsh-st-sort-wrap{display:flex;align-items:center;align-self:center;justify-content:flex-end;gap:8px;height:32px;margin:0 0 0 auto;min-width:0;flex:0 0 auto;flex-wrap:nowrap}
.dsh-st-filters{display:flex;align-items:center;align-self:center;justify-content:flex-end;gap:8px;height:32px;margin:0 0 0 auto;min-width:0;flex:0 0 auto;flex-wrap:nowrap}
.dsh-st-filters>*{margin:0 !important}
.dsh-st-filters .dsh-st-menu-select-wrap{width:auto !important;flex:0 0 auto !important;margin:0 !important}
.dsh-st-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.dsh-st-card,.dsh-st-empty{position:relative;padding:16px;border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md,12px);background:var(--dsw-alias-bg-layer-2);transition:border-color .15s ease,background .15s ease}
.dsh-st-card{cursor:pointer}
.dsh-st-card:hover{border-color:var(--dsw-alias-border-inverted,rgba(255,255,255,.18));background:var(--dsw-alias-bg-layer-3)}
.dsh-st-card h3,.dsh-st-empty h3{margin:10px 0 6px;font-size:14px;font-weight:500}
.dsh-st-card p,.dsh-st-empty p{margin:0 0 14px;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.dsh-st-card-head{display:flex;align-items:center;justify-content:space-between}
.dsh-st-menu-select-wrap{position:relative;display:inline-flex;vertical-align:middle;max-width:100%}
.dsh-st-menu-select-trigger{display:inline-flex;align-items:center;justify-content:space-between;gap:6px;height:32px;padding:0 10px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px;cursor:pointer;user-select:none;transition:border-color .15s ease,background .15s ease;width:100%}
.dsh-st-menu-select-trigger:hover:not(:disabled){border-color:var(--dsw-alias-border-inverted,rgba(255,255,255,.2));background:var(--dsw-alias-interactive-bg-hover)}
.dsh-st-menu-select-trigger.is-open{border-color:var(--dsw-alias-state-business-primary,#4c8dff)}
.dsh-st-menu-select-trigger:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4c8dff);outline-offset:2px}
.dsh-st-menu-select-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-st-menu-select-arrow{flex:none;color:var(--dsw-alias-label-tertiary)}
.dsh-st-card-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-top:12px;border-top:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-tertiary);font-size:12px}
.dsh-st-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:var(--dsw-radius-xs,4px);background:var(--dsw-alias-bg-layer-3,rgba(255,255,255,.06))}
.dsh-st-timeline{display:flex;flex-direction:column;gap:22px;padding-left:10px}
.dsh-st-group{position:relative;padding-left:18px}
.dsh-st-group:before{content:'';position:absolute;top:8px;bottom:0;left:4px;width:1px;background:var(--dsw-alias-border-l2,rgba(255,255,255,.08))}
.dsh-st-group h3{margin:0 0 10px;font-size:13px;font-weight:600}
.dsh-st-run{position:relative;margin:0 0 12px}
.dsh-st-run:after{content:'';position:absolute;top:6px;left:-18px;width:7px;height:7px;border-radius:50%;background:var(--dsw-alias-state-success-primary,#34c759)}
.dsh-st-run.is-failed:after,.dsh-st-run.is-interrupted:after{background:var(--dsw-alias-state-danger-primary,#ff6b6b)}
.dsh-st-run.is-queued:after,.dsh-st-run.is-skipped:after,.dsh-st-run.is-cancelled:after{background:var(--dsw-alias-label-tertiary,#8b8f98)}
.dsh-st-run strong{display:block;margin-bottom:4px;font-size:14px}
.dsh-st-run p{display:flex;gap:10px;margin:0;color:var(--dsw-alias-label-tertiary);font-size:12px}
.dsh-st-error{color:var(--dsw-alias-state-danger-primary,#ff6b6b);font-size:12px}
.dsh-st-workspace-empty{display:flex;flex-direction:column;align-items:flex-start;gap:6px}
.dsh-st-workspace-note{color:var(--dsw-alias-state-warning-primary,#d29922);font-size:12px;line-height:1.5}
.dsh-st-muted{color:var(--dsw-alias-label-secondary)}
.dsh-st-form{display:flex;flex-direction:column;gap:16px}.dsh-st-form>p{margin:0;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.5}
.dsh-st-field{display:flex;flex-direction:column;gap:6px;min-width:0;max-width:100%;font-size:13px;color:var(--dsw-alias-label-secondary);font-weight:500}
.dsh-st-field>input,.dsh-st-field>:last-child,.dsh-st-weekdays{width:100%;max-width:100%}
.dsh-st-weekdays{display:flex;flex-wrap:wrap;gap:8px 12px;width:auto}
.dsh-st-plan-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px 16px;align-items:start}.dsh-st-concurrency{min-width:0}
.dsh-st-inline{display:flex;flex-wrap:wrap;align-items:center;gap:8px;min-width:0;width:100%}.dsh-st-form .dsh-st-inline>.dsh-st-menu-select-wrap,.dsh-st-form .dsh-st-inline>.dsh-st-menu-select-wrap>span{display:flex;flex:1 1 120px;width:auto;min-width:0;height:auto;padding:0;margin:0;border:0}
.dsh-st-amount{flex:none;display:inline-flex;align-items:center;gap:6px;width:128px}
.dsh-st-amount input{width:100%;min-width:0}
.dsh-st-plan-hint{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:1.5}
.dsh-st-time{display:inline-flex;align-items:center;gap:6px;flex:none}.dsh-st-form .dsh-st-time .dsh-st-menu-select-wrap,.dsh-st-form .dsh-st-time .dsh-st-menu-select-wrap>span{width:64px;flex:none;min-width:64px}.dsh-st-time-sep{color:var(--dsw-alias-label-secondary)}
.dsh-st-suffix{color:var(--dsw-alias-label-secondary);font-size:13px;white-space:nowrap}
.dsh-st-settings{display:grid;grid-template-columns:1fr 1fr;gap:14px 16px}
.dsh-st-picker-field{display:flex;min-width:0;flex-direction:column;gap:6px;font-size:13px}
.dsh-st-picker-field>span{color:var(--dsw-alias-label-secondary);font-size:13px;font-weight:500}
.dsh-st-settings .dsh-st-menu-select-wrap,.dsh-st-settings .dsh-st-menu-select-wrap>span,.dsh-st-picker-field .dsh-st-menu-select-wrap,.dsh-st-picker-field .dsh-st-menu-select-wrap>span{display:flex;width:100%;min-width:0;height:auto;padding:0;margin:0;border:0}
.dsh-st-form .dsh-st-menu-select-trigger{width:100%;height:32px;min-width:0;justify-content:space-between}
.dsh-st-form-menu{box-sizing:border-box;width:max(var(--dsh-st-menu-width,144px),144px) !important;min-width:max(var(--dsh-st-menu-width,144px),144px) !important;max-width:360px !important}
.dsh-st-prompt-label{display:flex;align-items:baseline;justify-content:space-between;gap:8px}
.dsh-st-prompt-label em{color:var(--dsw-alias-label-tertiary);font-size:12px;font-style:normal;font-weight:450}
.dsh-st-prompt-card{position:relative;display:flex;flex-direction:column;flex:none;border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md,12px);background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.03));overflow:hidden}
.dsh-st-prompt-anchor{position:relative}
.dsh-st-skill-menu{position:absolute;z-index:30;left:0;right:0;bottom:calc(100% + 6px);max-height:320px;margin:0;padding:4px;overflow:auto;border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-specific-menu,var(--dsw-alias-bg-layer-1,#1c1c1c));backdrop-filter:var(--dsw-menu-backdrop-filter,blur(16px));box-shadow:0 8px 24px rgba(0,0,0,.28)}
.dsh-st-skill-menu p{margin:6px 8px;color:var(--dsw-alias-label-tertiary);font-size:12px}
.dsh-st-skill-menu button{display:flex;width:100%;align-items:center;justify-content:space-between;gap:8px;border:0;border-radius:6px;background:transparent;color:inherit;padding:6px 8px;text-align:left;cursor:pointer}
.dsh-st-skill-menu button[aria-selected="true"],.dsh-st-skill-menu button:hover{background:color-mix(in srgb,var(--dsw-alias-brand-primary,#4b7cff) 16%,transparent)}
.dsh-st-skill-menu code{color:var(--dsw-alias-label-tertiary);font-size:12px}
.dsh-st-prompt-card textarea{position:relative;z-index:1;box-sizing:border-box;width:100%;margin:0;padding:14px 16px 8px !important;border:0;font-size:14px;line-height:1.65;letter-spacing:normal;resize:none;color:transparent !important;caret-color:var(--dsw-alias-label-primary,currentColor) !important;background:transparent !important}
.dsh-st-prompt-card textarea::placeholder{color:var(--dsw-alias-label-tertiary)}
.dsh-st-prompt-card textarea::selection{color:transparent;background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#4b7cff) 28%,transparent)}
.dsh-st-prompt-backdrop{position:absolute;z-index:0;inset:0;overflow:hidden;padding:14px 16px 8px;font-size:14px;line-height:1.65;white-space:pre-wrap;overflow-wrap:anywhere;pointer-events:none;color:inherit}
.dsh-st-skill-token{margin:0 -4px;padding:0 4px;border-radius:var(--dsw-radius-sm,4px);color:var(--dsw-alias-state-business-primary,#4b7cff);background:var(--dsw-alias-state-business-tertiary,color-mix(in srgb,var(--dsw-alias-state-business-primary,#4b7cff) 14%,transparent));font-weight:500;box-decoration-break:clone;-webkit-box-decoration-break:clone}
@media(max-width:860px){.dsh-st-toolbar{flex-wrap:wrap}.dsh-st-search{flex-basis:100%;max-width:none}.dsh-st-grid,.dsh-st-example-row{grid-template-columns:1fr}.dsh-st-filters{width:100%;margin:8px 0}}
.dsh-st-n-views-wrap{display:flex;flex:none;margin:2px 0 8px;padding:0 var(--dsh-session-list-edge-inset,12px) 0 0;width:100%;box-sizing:border-box}
.dsh-st-n-views-wrap .dsh-st-rail-views{margin:0!important;width:100%!important}
.dsh-st-n-view-body{display:flex;flex:1;min-width:0;min-height:0;flex-direction:column}
/* 以下两段覆盖宿主 SegmentedTabs 的胶囊外观。选择器依赖原语渲染出的结构：
   容器 [role=tablist] 的首个子元素是 aria-hidden 的滑动指示器，其后才是各 [role=tab]。
   升级 @deepseek-ai/dsh-client-ui-primitives 时必须复核该结构，否则这些规则会静默失效。 */
.dsh-st-rail-views{display:grid!important;box-sizing:border-box!important;height:32px!important;min-height:32px!important;max-height:32px!important;margin:0!important;padding:2px!important;border:0!important;border-radius:var(--dsw-radius-sm,8px)!important;box-shadow:inset 0 0 0 .5px var(--dsw-alias-border-l2,rgba(255,255,255,.08))!important;background:var(--dsw-alias-bg-layer-1,rgba(255,255,255,.02))!important;width:100%!important}
.dsh-st-rail-views>span[aria-hidden="true"]{inset:2px auto 2px 2px!important;width:calc((100% - 4px)/2)!important;border-radius:6px!important;border:0.5px solid var(--dsw-alias-border-l3,rgba(255,255,255,.12))!important;background:var(--dsw-alias-bg-layer-3,rgba(255,255,255,.08))!important;box-shadow:none!important}
.dsh-st-rail-views [role=tab]{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;height:28px!important;padding:0 clamp(6px,calc(100% - 60px),12px)!important;font-size:13px!important;line-height:20px!important;border-radius:6px!important;color:var(--dsw-alias-label-secondary,#8b8f98)!important;text-align:center!important;white-space:nowrap!important;box-sizing:border-box!important;transition:color 150ms ease!important}
.dsh-st-rail-views [role=tab]>*{display:inline-flex!important;align-items:center!important;justify-content:center!important}
.dsh-st-rail-views [role=tab]:hover{color:var(--dsw-alias-label-primary,inherit)!important}
.dsh-st-rail-views [role=tab][aria-selected=true]{color:var(--dsw-alias-label-primary,inherit)!important;font-weight:600!important}
.dsh-st-overview{display:flex;flex-direction:column;flex:1;min-height:0;overflow-y:auto;padding:2px var(--dsh-session-list-edge-inset,12px) 14px 0}
.dsh-st-overview-head{display:flex;flex:none;align-items:center;justify-content:space-between;gap:8px;height:36px;min-height:36px;margin-bottom:4px;padding:6px 0}
.dsh-st-overview-title{display:flex;align-items:baseline;min-width:0;gap:6px;color:var(--dsw-alias-label-tertiary,#81858C)}
.dsh-st-overview-title strong{font-size:14px;font-weight:400;line-height:20px}
.dsh-st-overview-title span{display:inline-grid;place-items:center;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:var(--dsw-alias-bg-layer-3,rgba(255,255,255,.1));color:var(--dsw-alias-label-tertiary,#8b8f98);font-size:11px;line-height:18px}
.dsh-st-overview-actions{display:flex;flex:none;align-items:center;gap:4px}.dsh-st-overview-sort{display:flex;align-items:center}
.dsh-st-overview-search{display:flex;flex:none;align-items:center;gap:6px;height:30px;margin:0 0 8px;padding:0 8px;border:.5px solid var(--dsw-alias-border-l2,rgba(255,255,255,.08));border-radius:8px;background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.035));color:var(--dsw-alias-label-secondary,#8b8f98)}
.dsh-st-overview-search input{flex:1;min-width:0;border:0;outline:none;background:transparent;color:var(--dsw-alias-label-primary,inherit);font:14px/20px inherit}
.dsh-st-overview-search button{display:inline-flex;align-items:center;justify-content:center;flex:none;width:20px;height:20px;padding:0;border:0;border-radius:4px;background:transparent;color:var(--dsw-alias-label-tertiary,#8b8f98);cursor:pointer}
.dsh-st-overview-search button:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06));color:var(--dsw-alias-label-primary,inherit)}
.dsh-st-overview-row{position:relative;width:100%;min-height:56px;margin:0 0 8px;border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.1));border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.035));color:var(--dsw-alias-label-primary,inherit);box-shadow:inset 0 1px rgba(255,255,255,.025);transition:background .14s ease,border-color .14s ease;overflow:hidden}
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
.dsh-st-rail-empty{padding:16px 10px;color:var(--dsw-alias-label-tertiary,#8b8f98);font-size:12px}
.dsh-st-shell-rail{display:flex;flex-direction:column;min-height:0;flex:1;height:100%;overflow:hidden}
.dsh-st-shell-tabs-wrap{display:flex;margin:2px var(--dsh-sidebar-inline-padding,12px) 8px 0;padding:0;width:auto}
.dsh-st-shell-tabs-wrap .dsh-st-shell-segmented-tabs{display:grid!important;width:100%!important;box-sizing:border-box!important;height:32px!important;min-height:32px!important;max-height:32px!important;padding:2px!important;border:0!important;border-radius:var(--dsw-radius-sm,8px)!important;box-shadow:inset 0 0 0 .5px var(--dsw-alias-border-l2,rgba(255,255,255,.08))!important;background:var(--dsw-alias-bg-layer-1,rgba(255,255,255,.02))!important}
.dsh-st-shell-tabs-wrap .dsh-st-shell-segmented-tabs>span[aria-hidden="true"]{inset:2px auto 2px 2px!important;width:calc((100% - 4px)/var(--dsh-st-tab-count,3))!important;border-radius:6px!important;border:0.5px solid var(--dsw-alias-border-l3,rgba(255,255,255,.12))!important;background:var(--dsw-alias-bg-layer-3,rgba(255,255,255,.08))!important;box-shadow:none!important}
.dsh-st-shell-tabs-wrap .dsh-st-shell-segmented-tabs [role=tab]{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;height:28px!important;padding:0 clamp(6px,calc(100% - 60px),12px)!important;font-size:13px!important;line-height:20px!important;border-radius:6px!important;color:var(--dsw-alias-label-secondary,#8b8f98)!important;text-align:center!important;white-space:nowrap!important;box-sizing:border-box!important;transition:color 150ms ease!important}
.dsh-st-shell-tabs-wrap .dsh-st-shell-segmented-tabs [role=tab]>*{display:inline-flex!important;align-items:center!important;justify-content:center!important}
.dsh-st-shell-tabs-wrap .dsh-st-shell-segmented-tabs [role=tab]:hover{color:var(--dsw-alias-label-primary,inherit)!important}
.dsh-st-shell-tabs-wrap .dsh-st-shell-segmented-tabs [role=tab][aria-selected=true]{color:var(--dsw-alias-label-primary,inherit)!important;font-weight:600!important}
.dsh-st-shell-body{display:flex;min-height:0;flex:1;overflow:hidden}
.dsh-st-shell-body>*{min-width:0;flex:1}.dsh-st-official-tree{display:flex;min-height:0;flex:1;overflow:hidden}.dsh-st-official-tree>*{min-width:0;flex:1}
.dsh-st-schedule-tree{display:flex;min-height:0;flex:1;overflow:hidden}
.dsh-st-schedule-tree>*{min-width:0;flex:1}
/* 记录视图的分组是自动化任务：保留 … 菜单供注入「任务设置」，只隐藏组头新建按钮。 */
.dsh-st-schedule-tree [data-row-key^="workspace:dsh-automation-task:"] > span:last-child > :last-child{display:none}
/* 按工作区/工作区树模式隐藏分组操作条，避免对真实工作区重命名、删除或归档全部会话。 */
.dsh-st-schedule-tree[data-mode="workspace"] [data-row-key^="workspace:"] > span:last-child,
.dsh-st-schedule-tree[data-mode="workspace-tree"] [data-row-key^="workspace:"] > span:last-child{display:none}
.dsh-st-session-clock{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;color:var(--dsw-alias-label-tertiary,#8b8f98)}
.dsh-st-n,.dsh-st-n *{box-sizing:border-box}.dsh-st-n{--dsh-session-list-edge-inset:var(--dsh-sidebar-inline-padding,12px);box-sizing:border-box;display:flex;flex:1;min-width:0;min-height:0;flex-direction:column;padding:0;color:var(--dsw-alias-label-primary,inherit);font:14px/20px inherit;overflow:hidden}
.dsh-st-n-empty{padding:16px 12px;color:var(--dsw-alias-label-tertiary,#8b8f98);font-size:13px}
.dsh-st-n-head-btn{cursor:pointer;width:28px;height:28px;min-width:28px;min-height:28px;position:relative;z-index:1;color:var(--dsw-alias-label-secondary);background:transparent;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}
.dsh-st-n-head-btn:hover,.dsh-st-n-head-btn.is-on{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06));color:var(--dsw-alias-label-primary,inherit)}
.dsh-st-modal-action{min-width:72px}
.dsh-st-btn-danger:not(:disabled){color:var(--dsw-alias-state-error-primary,#ef7272)}
.dsh-st-create-dialog{width:min(720px,100%) !important;max-height:100%}
.dsh-st-create-content{flex:1;min-height:0;overflow:hidden}
.dsh-st-create-content>div:last-child{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;scrollbar-gutter:stable}
`

export function installStyles(): () => void {
  const existing = document.getElementById(STYLE_ID)
  if (existing instanceof HTMLStyleElement) {
    existing.textContent = CSS_TEXT
    existing.setAttribute('data-plugin', STYLE_OWNER)
    return () => undefined
  }
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = CSS_TEXT
  style.setAttribute('data-plugin', STYLE_OWNER)
  document.head.append(style)
  return () => { style.remove() }
}

const UPDATE_STYLE_ID = 'michengai-plugin-update-ui'

export function installPluginUpdateStyle(css: string): void {
  const existing = document.getElementById(UPDATE_STYLE_ID)
  if (existing instanceof HTMLStyleElement) {
    // 这张表的 id 被多个插件共用。已有归属时不改写，避免本插件重载删掉别人的表。
    if (existing.getAttribute('data-plugin') === null) existing.setAttribute('data-plugin', STYLE_OWNER)
    return
  }
  const style = document.createElement('style')
  style.id = UPDATE_STYLE_ID
  style.textContent = css
  style.setAttribute('data-plugin', STYLE_OWNER)
  ;(document.head ?? document.documentElement).append(style)
}
