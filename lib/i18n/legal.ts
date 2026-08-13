import type { Locale } from "./config";

/**
 * Privacy policy and terms of use, in both languages.
 *
 * The Japanese is the source text and is reproduced verbatim from the original
 * pages. The English is a translation provided for convenience — see
 * `legal.notice` in the dictionaries, which is rendered above the English text
 * and states plainly that the Japanese version is the binding one. A
 * translation is not a second legal instrument, and the page says so rather
 * than implying two equally authoritative versions exist.
 */

export interface LegalSection {
  title: string;
  paragraphs: string[];
}

const ja = {
  privacy: [
    {
      title: "オンライン販売・注文情報",
      paragraphs: [
        "このサイトは商品・レシピの紹介を目的とするカタログです。カート、決済、注文受付を提供していないため、購入に必要な氏名、住所、電話番号、決済情報をこのサイトで取得・保管しません。",
      ],
    },
    {
      title: "お問い合わせ",
      paragraphs: [
        "お問い合わせ先のメールリンクを利用する場合、宛先、件名、本文などはお客様のメールソフトまたはメールサービスを通じて送信されます。送信する内容は必要最小限にしてください。",
      ],
    },
    {
      title: "技術情報と運営サービス",
      paragraphs: [
        "サイトの安全な運営のため、ホスティング事業者がアクセス日時、IPアドレス、ブラウザ種別、エラー情報などの最小限の技術情報を処理する場合があります。",
        "商品カタログと画像は、当サイトが利用するホスティング・ストレージサービス上で管理します。個人情報を販売したり、カタログ運営以外の目的で第三者へ提供したりすることはありません。",
      ],
    },
    {
      title: "管理画面",
      paragraphs: [
        "管理画面はカタログ編集のために限定公開されています。認証のために安全なセッションCookieを使用する場合があります。このCookieは管理機能の提供以外には利用しません。",
      ],
    },
    {
      title: "お問い合わせ・改定",
      paragraphs: [
        "本ポリシーに関するご質問は、お問い合わせページに記載の窓口までご連絡ください。運用内容や法令の変更に応じて、本ポリシーを更新する場合があります。",
      ],
    },
  ] satisfies LegalSection[],

  terms: [
    {
      title: "適用範囲",
      paragraphs: [
        "本規約は、商品情報、原材料、レシピ、写真、その他の掲載コンテンツを閲覧・利用するすべての方に適用されます。",
        "サービスへの不正な干渉、運営を妨げる行為、または掲載内容の目的外利用はお控えください。",
      ],
    },
    {
      title: "商品情報について",
      paragraphs: [
        "商品名、原材料、内容量、使用方法、画像などは、分かりやすく正確にお伝えできるよう努めています。パッケージ表示や実際の見え方は、掲載内容と異なる場合があります。",
        "掲載情報は医療上の助言ではありません。アレルギーや特別な食事制限がある場合は、必ず実際のパッケージ表示をご確認ください。",
      ],
    },
    {
      title: "オンライン販売について",
      paragraphs: [
        "このサイトは商品とレシピを紹介する公式カタログです。カート、決済、配送、返品受付などのオンライン販売機能は提供していません。",
      ],
    },
    {
      title: "著作権・知的財産",
      paragraphs: [
        "ロゴ、写真、レシピ、編集コンテンツ、画面デザインは、MOOR SPICE に帰属するか、適切な権利に基づいて使用されています。許可なく複製・転載・商用利用することはできません。",
      ],
    },
    {
      title: "変更・お問い合わせ",
      paragraphs: [
        "サービス内容や法令上の要件に応じて、本規約を更新する場合があります。更新後の規約は本ページに掲載した時点から適用されます。",
        "ご不明な点は、お問い合わせページに記載の窓口までご連絡ください。",
      ],
    },
  ] satisfies LegalSection[],
};

const en = {
  privacy: [
    {
      title: "Online sales and order information",
      paragraphs: [
        "This site is a catalogue for presenting products and recipes. It provides no basket, no payment and no order handling, so it neither collects nor stores the name, address, telephone number or payment details a purchase would require.",
      ],
    },
    {
      title: "Getting in touch",
      paragraphs: [
        "If you use the email link on the contact page, the recipient, subject and body are sent through your own mail client or mail service. Please include no more than you need to.",
      ],
    },
    {
      title: "Technical information and hosting",
      paragraphs: [
        "To keep the site running safely, our hosting provider may process minimal technical information such as access times, IP addresses, browser type and error reports.",
        "The product catalogue and its images are held on the hosting and storage services this site uses. We do not sell personal information, and we do not pass it to third parties for any purpose beyond running the catalogue.",
      ],
    },
    {
      title: "The admin panel",
      paragraphs: [
        "The admin panel is published privately for editing the catalogue. It may use a secure session cookie for authentication. That cookie is used for nothing other than providing the admin features.",
      ],
    },
    {
      title: "Questions and revisions",
      paragraphs: [
        "For questions about this policy, please use the contact details on the contact page. We may update this policy as our practices or the applicable law change.",
      ],
    },
  ] satisfies LegalSection[],

  terms: [
    {
      title: "Scope",
      paragraphs: [
        "These terms apply to everyone who views or uses the product information, ingredients, recipes, photographs and other published content on this site.",
        "Please do not interfere with the service, obstruct its operation, or use the published material for purposes other than those intended.",
      ],
    },
    {
      title: "About the product information",
      paragraphs: [
        "We aim to present product names, ingredients, net weights, methods and images clearly and accurately. Packaging and actual appearance may differ from what is shown here.",
        "Nothing here is medical advice. If you have allergies or particular dietary requirements, always check the actual packaging.",
      ],
    },
    {
      title: "About online sales",
      paragraphs: [
        "This site is an official catalogue presenting products and recipes. It offers no online sales functionality — no basket, payment, delivery or returns handling.",
      ],
    },
    {
      title: "Copyright and intellectual property",
      paragraphs: [
        "The logo, photographs, recipes, editorial content and interface design either belong to MOOR SPICE or are used under appropriate rights. They may not be reproduced, republished or used commercially without permission.",
      ],
    },
    {
      title: "Changes and contact",
      paragraphs: [
        "We may update these terms as the service or legal requirements change. Updated terms apply from the moment they are published on this page.",
        "If anything is unclear, please use the contact details on the contact page.",
      ],
    },
  ] satisfies LegalSection[],
};

export type LegalContent = typeof ja;

export const legalContent: Record<Locale, LegalContent> = {
  ja,
  en: en as unknown as LegalContent,
};
