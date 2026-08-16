const STYLE_ID = 'dsh-automation-styles'

const CSS_TEXT = `
.dsh-st-shell{max-width:1080px;margin:0 auto;padding:4px 2px 56px;color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family,system-ui)}
.dsh-st-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:18px}
.dsh-st-top h1{margin:0 0 6px;font-size:28px;font-weight:700;letter-spacing:-.03em}
.dsh-st-top p{margin:0;max-width:42em;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.55}
.dsh-st-toolbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:8px}
.dsh-st-search{width:220px;height:34px;padding:0 14px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;background:var(--dsw-alias-bg-layer-1);color:inherit}
.dsh-st-btn,.dsh-st-icon{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:34px;padding:0 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;background:var(--dsw-alias-bg-layer-1);color:inherit;cursor:pointer}
.dsh-st-icon{width:34px;padding:0}
.dsh-st-btn--primary{border-color:transparent;background:#4b7cff;color:#fff}
.dsh-st-hint{margin:-6px 0 14px;padding:10px 12px;border-radius:10px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font-size:12px}
.dsh-st-banner{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:22px;padding:10px 14px;border-radius:12px;background:rgba(53,104,196,.22);color:#c9dbff;font-size:13px}
.dsh-st-banner>span{display:inline-flex;align-items:center;gap:8px}
.dsh-st-toggle{display:inline-flex;align-items:center;gap:8px;white-space:nowrap}
.dsh-st-toggle button,.dsh-st-switch{width:40px;height:22px;border:0;border-radius:999px;background:rgba(255,255,255,.18);position:relative;cursor:pointer}
.dsh-st-switch{width:42px;height:24px;background:#3a3d42}
.dsh-st-toggle button:after,.dsh-st-switch:after{content:'';position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:transform .16s ease}
.dsh-st-toggle button.is-on,.dsh-st-switch.is-on{background:#34c759}
.dsh-st-toggle button.is-on:after,.dsh-st-switch.is-on:after{transform:translateX(18px)}
.dsh-st-examples{margin-bottom:22px}
.dsh-st-examples-head h2{margin:0 0 10px;font-size:13px;font-weight:600;color:var(--dsw-alias-label-secondary)}
.dsh-st-example-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.dsh-st-example{display:flex;flex-direction:column;align-items:flex-start;gap:8px;min-height:132px;padding:14px;border:1px solid var(--dsw-alias-border-l2);border-radius:14px;background:rgba(255,255,255,.03);color:inherit;text-align:left;cursor:pointer}
.dsh-st-example:hover{border-color:rgba(75,124,255,.45)}
.dsh-st-example strong{font-size:14px}
.dsh-st-example p{margin:0;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.dsh-st-tabs{display:flex;align-items:center;gap:16px;margin:4px 0 16px;border-bottom:1px solid var(--dsw-alias-border-l2)}
.dsh-st-tabs>button{padding:8px 0;border:0;border-bottom:2px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.dsh-st-tabs>button.is-on{border-bottom-color:currentColor;color:var(--dsw-alias-label-primary);font-weight:650}
.dsh-st-sort{margin-left:auto;color:var(--dsw-alias-label-tertiary);font-size:12px}
.dsh-st-filters{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-left:auto}
.dsh-st-filters>button,.dsh-st-filters>select{height:28px;padding:0 10px;border:0;border-radius:999px;background:rgba(255,255,255,.06);color:inherit;font-size:12px}
.dsh-st-filters>button.is-on{background:rgba(255,255,255,.14)}
.dsh-st-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.dsh-st-card,.dsh-st-empty{position:relative;padding:16px;border:1px solid var(--dsw-alias-border-l2);border-radius:16px;background:rgba(255,255,255,.03)}
.dsh-st-card h3,.dsh-st-empty h3{margin:10px 0 6px;font-size:15px}
.dsh-st-card p,.dsh-st-empty p{margin:0 0 14px;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.dsh-st-card-head{display:flex;align-items:center;justify-content:space-between}
.dsh-st-card-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-top:12px;border-top:1px dashed var(--dsw-alias-border-l2);color:var(--dsw-alias-label-tertiary);font-size:12px}
.dsh-st-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:999px;background:rgba(255,255,255,.06)}
.dsh-st-more{width:28px;height:28px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer}
.dsh-st-menu{position:absolute;top:40px;right:12px;z-index:3;min-width:148px;padding:6px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-base);box-shadow:0 10px 30px rgba(0,0,0,.28)}
.dsh-st-menu button{display:flex;width:100%;align-items:center;gap:8px;padding:8px 10px;border:0;border-radius:8px;background:transparent;color:inherit;cursor:pointer}
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
.dsh-st-mask{position:fixed;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.45)}
.dsh-st-modal{width:min(560px,100%);max-height:min(88vh,760px);overflow:auto;padding:20px;border:1px solid var(--dsw-alias-border-l2);border-radius:18px;background:var(--dsw-alias-bg-base)}
.dsh-st-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}
.dsh-st-modal-head h2{margin:0 0 4px;font-size:20px}
.dsh-st-field{display:flex;flex-direction:column;gap:6px;margin-bottom:12px;font-size:13px}
.dsh-st-field input,.dsh-st-field select,.dsh-st-field textarea{width:100%;padding:9px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-1);color:inherit}
.dsh-st-field textarea{min-height:110px;resize:vertical}
.dsh-st-inline{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.dsh-st-inline select,.dsh-st-inline input{flex:1;min-width:120px}
.dsh-st-weekdays{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}
.dsh-st-weekdays button{min-width:40px;padding:6px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:transparent;color:inherit;cursor:pointer}
.dsh-st-weekdays button.is-on{border-color:#4b7cff;color:#4b7cff}
.dsh-st-check{display:inline-flex;align-items:center;gap:6px;margin:0 0 12px;font-size:12px}
.dsh-st-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:8px}
@media(max-width:860px){.dsh-st-top,.dsh-st-banner{flex-direction:column}.dsh-st-grid,.dsh-st-example-row{grid-template-columns:1fr}.dsh-st-search{width:100%}.dsh-st-filters{width:100%;margin:8px 0}}
.dsh-st-select{position:relative;min-width:108px}
.dsh-st-select.is-wide{min-width:148px}
.dsh-st-select-btn,.dsh-st-chip-btn,.dsh-st-field input,.dsh-st-field textarea{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:rgba(255,255,255,.04);color:inherit}
.dsh-st-select-btn{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:36px;width:100%;padding:0 12px;cursor:pointer}
.dsh-st-select-btn em{width:8px;height:8px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:rotate(45deg) translateY(-2px);opacity:.7}
.dsh-st-select-menu{position:absolute;top:calc(100% + 6px);left:0;z-index:8;min-width:100%;max-height:240px;overflow:auto;padding:6px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-base);box-shadow:0 12px 32px rgba(0,0,0,.32)}
.dsh-st-select-menu button{display:flex;flex-direction:column;align-items:flex-start;width:100%;padding:8px 10px;border:0;border-radius:8px;background:transparent;color:inherit;text-align:left;cursor:pointer}
.dsh-st-select-menu button small{color:var(--dsw-alias-label-tertiary);font-size:11px}
.dsh-st-select-menu button:hover,.dsh-st-select-menu button.is-on{background:rgba(255,255,255,.06)}
.dsh-st-select-empty{padding:10px;color:var(--dsw-alias-label-tertiary);font-size:12px}
.dsh-st-chip-btn{display:inline-flex;align-items:center;min-height:32px;padding:0 10px;border-radius:999px;cursor:pointer}
.dsh-st-suffix{color:var(--dsw-alias-label-secondary);font-size:13px}
.dsh-st-inline input.is-narrow{width:72px;flex:none}
.dsh-st-weekdays button{min-width:52px;height:34px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);background:transparent}
.dsh-st-weekdays button.is-on{border-color:transparent;background:#fff;color:#111}
.dsh-st-prompt-card{border:1px solid var(--dsw-alias-border-l2);border-radius:16px;overflow:hidden;background:rgba(255,255,255,.03)}
.dsh-st-prompt-card textarea{border:0;background:transparent;min-height:140px}
.dsh-st-composer{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px;border-top:1px solid var(--dsw-alias-border-l2)}
.dsh-st-composer-right{display:flex;flex-wrap:wrap;align-items:center;gap:6px}

`

export function installStyles(): () => void {
  const existing = document.getElementById(STYLE_ID)
  if (existing !== null) return () => undefined
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = CSS_TEXT
  document.head.append(style)
  return () => { style.remove() }
}
