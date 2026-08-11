/*
 * 领地 AI 本地价格配置。
 *
 * 这是静态数据，不会自动同步，也不包含接口、凭据、商品跳转或支付能力。
 * 每次经授权人工核对信息后，更新 price 与 verifiedAt；
 * 同时按 README.md 的清单同步 HTML 元信息与静态回退文案。
 */
window.LINGDI_AI_PRICING = Object.freeze({
  verifiedAt: '2026-08-11',
  currency: 'CNY',
  sourceType: 'manual-read-only-check',
  plans: Object.freeze({
    plus: Object.freeze({displayName: 'ChatGPT Plus 1个月', price: 138}),
    gpt5x: Object.freeze({displayName: 'GPT 5X', price: 798}),
    gpt20x: Object.freeze({displayName: 'GPT 20X', price: 1298})
  })
});
