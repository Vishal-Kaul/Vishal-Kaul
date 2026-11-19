import type { Message } from '@/lib/types';

export function Bubble({ message }: { message: Message }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[300px] whitespace-pre-wrap break-words rounded-[18px] bg-ink px-[18px] py-[13px] text-[16px] text-white">
          {message.text}
        </div>
      </div>
    );
  }
  return (
    <div className="w-full whitespace-pre-wrap break-words rounded-[18px] border border-line bg-white px-[18px] py-[14px] text-[16px] leading-[25px] text-ink">
      {message.text}
      {message.partial && <div className="text-[13px] leading-[20px] text-subtle">Reply cut off.</div>}
    </div>
  );
}
