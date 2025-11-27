import PublishPage, { metadata } from '@/app/publish/page';

export { metadata };

export default function LocalePublishPage(props: { searchParams?: { asset?: string } }) {
  return <PublishPage searchParams={props.searchParams} />;
}
