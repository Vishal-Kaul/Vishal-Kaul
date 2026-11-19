import { AssistantApp } from '@/components/AssistantApp';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  return (
    <AssistantApp embed={sp.embed === '1'}>
      <h1 className="sr-only">Vishal Kaul</h1>
    </AssistantApp>
  );
}
