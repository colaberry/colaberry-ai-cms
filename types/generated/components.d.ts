import type { Schema, Struct } from '@strapi/strapi';

export interface DeepCallout extends Struct.ComponentSchema {
  collectionName: 'components_deep_callouts';
  info: {
    description: 'Highlighted callout block (note/warning/insight) for design trade-offs and key takeaways.';
    displayName: 'Callout';
    icon: 'exclamation';
  };
  attributes: {
    body: Schema.Attribute.Text & Schema.Attribute.Required;
    title: Schema.Attribute.String;
    variant: Schema.Attribute.Enumeration<
      ['note', 'insight', 'warning', 'quote']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'insight'>;
  };
}

export interface DeepCodeBlock extends Struct.ComponentSchema {
  collectionName: 'components_deep_code_blocks';
  info: {
    description: 'Monospace code snippet with language tag and optional caption.';
    displayName: 'Code Block';
    icon: 'code';
  };
  attributes: {
    caption: Schema.Attribute.String;
    code: Schema.Attribute.Text & Schema.Attribute.Required;
    language: Schema.Attribute.String & Schema.Attribute.DefaultTo<'text'>;
  };
}

export interface DeepHeading extends Struct.ComponentSchema {
  collectionName: 'components_deep_headings';
  info: {
    description: 'Section heading (h2/h3/h4) with optional anchor for deep-dive table of contents.';
    displayName: 'Heading';
    icon: 'header';
  };
  attributes: {
    anchor: Schema.Attribute.String;
    level: Schema.Attribute.Enumeration<['h2', 'h3', 'h4']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'h2'>;
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface DeepImage extends Struct.ComponentSchema {
  collectionName: 'components_deep_images';
  info: {
    description: 'Figure with caption and alt text. Used for architecture diagrams and training charts.';
    displayName: 'Image';
    icon: 'picture-o';
  };
  attributes: {
    alt: Schema.Attribute.String & Schema.Attribute.Required;
    caption: Schema.Attribute.String;
    media: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
  };
}

export interface DeepList extends Struct.ComponentSchema {
  collectionName: 'components_deep_lists';
  info: {
    description: 'Bulleted or numbered list. Items is a JSON array of strings (markdown supported).';
    displayName: 'List';
    icon: 'list-ul';
  };
  attributes: {
    items: Schema.Attribute.JSON & Schema.Attribute.Required;
    style: Schema.Attribute.Enumeration<['bullet', 'number']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'bullet'>;
  };
}

export interface DeepParagraph extends Struct.ComponentSchema {
  collectionName: 'components_deep_paragraphs';
  info: {
    description: 'Body paragraph with markdown/richtext support.';
    displayName: 'Paragraph';
    icon: 'align-justify';
  };
  attributes: {
    body: Schema.Attribute.RichText & Schema.Attribute.Required;
  };
}

export interface DeepReferences extends Struct.ComponentSchema {
  collectionName: 'components_deep_references';
  info: {
    description: 'Final references list. Items is a JSON array of { label, url } objects cited in the deep dive.';
    displayName: 'References';
    icon: 'link';
  };
  attributes: {
    heading: Schema.Attribute.String & Schema.Attribute.DefaultTo<'References'>;
    items: Schema.Attribute.JSON & Schema.Attribute.Required;
  };
}

export interface DeepTable extends Struct.ComponentSchema {
  collectionName: 'components_deep_tables';
  info: {
    description: 'Structured table for hyperparameter specs. Headers and rows are JSON arrays.';
    displayName: 'Table';
    icon: 'table';
  };
  attributes: {
    caption: Schema.Attribute.String;
    headers: Schema.Attribute.JSON & Schema.Attribute.Required;
    rows: Schema.Attribute.JSON & Schema.Attribute.Required;
  };
}

export interface SharedMedia extends Struct.ComponentSchema {
  collectionName: 'components_shared_media';
  info: {
    displayName: 'Media';
    icon: 'file-video';
  };
  attributes: {
    file: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
  };
}

export interface SharedNavigationChild extends Struct.ComponentSchema {
  collectionName: 'components_shared_navigation_children';
  info: {
    displayName: 'Navigation Child';
  };
  attributes: {
    group: Schema.Attribute.String;
    href: Schema.Attribute.String & Schema.Attribute.Required;
    icon: Schema.Attribute.String;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    order: Schema.Attribute.Integer;
    target: Schema.Attribute.Enumeration<['_self', '_blank']>;
  };
}

export interface SharedNavigationColumn extends Struct.ComponentSchema {
  collectionName: 'components_shared_navigation_columns';
  info: {
    displayName: 'Navigation Column';
  };
  attributes: {
    links: Schema.Attribute.Component<'shared.navigation-link', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedNavigationLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_navigation_links';
  info: {
    displayName: 'Navigation Link';
  };
  attributes: {
    children: Schema.Attribute.Component<'shared.navigation-child', true>;
    group: Schema.Attribute.String;
    href: Schema.Attribute.String & Schema.Attribute.Required;
    icon: Schema.Attribute.String;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    order: Schema.Attribute.Integer;
    target: Schema.Attribute.Enumeration<['_self', '_blank']>;
  };
}

export interface SharedPlatformLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_platform_links';
  info: {
    displayName: 'Platform Link';
  };
  attributes: {
    platform: Schema.Attribute.Enumeration<
      ['apple', 'spotify', 'youtube', 'substack', 'twitter']
    >;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedPodcastDistribution extends Struct.ComponentSchema {
  collectionName: 'components_shared_podcast_distributions';
  info: {
    displayName: 'Podcast Distribution';
  };
  attributes: {
    applePodcastUrl: Schema.Attribute.String;
    spotifyUrl: Schema.Attribute.String;
    substackUrl: Schema.Attribute.String;
    twitterUrl: Schema.Attribute.String;
    youtubeUrl: Schema.Attribute.String;
  };
}

export interface SharedQuote extends Struct.ComponentSchema {
  collectionName: 'components_shared_quotes';
  info: {
    displayName: 'Quote';
    icon: 'indent';
  };
  attributes: {
    body: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SharedRichText extends Struct.ComponentSchema {
  collectionName: 'components_shared_rich_texts';
  info: {
    description: '';
    displayName: 'Rich text';
    icon: 'align-justify';
  };
  attributes: {
    body: Schema.Attribute.RichText;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: '';
    displayName: 'Seo';
    icon: 'allergies';
    name: 'Seo';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text & Schema.Attribute.Required;
    metaTitle: Schema.Attribute.String & Schema.Attribute.Required;
    shareImage: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedSlider extends Struct.ComponentSchema {
  collectionName: 'components_shared_sliders';
  info: {
    description: '';
    displayName: 'Slider';
    icon: 'address-book';
  };
  attributes: {
    files: Schema.Attribute.Media<'images', true>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'deep.callout': DeepCallout;
      'deep.code-block': DeepCodeBlock;
      'deep.heading': DeepHeading;
      'deep.image': DeepImage;
      'deep.list': DeepList;
      'deep.paragraph': DeepParagraph;
      'deep.references': DeepReferences;
      'deep.table': DeepTable;
      'shared.media': SharedMedia;
      'shared.navigation-child': SharedNavigationChild;
      'shared.navigation-column': SharedNavigationColumn;
      'shared.navigation-link': SharedNavigationLink;
      'shared.platform-link': SharedPlatformLink;
      'shared.podcast-distribution': SharedPodcastDistribution;
      'shared.quote': SharedQuote;
      'shared.rich-text': SharedRichText;
      'shared.seo': SharedSeo;
      'shared.slider': SharedSlider;
    }
  }
}
