export function ChatFooter({ variant }: { variant: 'desktop' | 'mobile' }) {
  return (
    <p className="text-center text-[12px] font-medium text-subtle-text">
      {variant === 'mobile'
        ? 'I’m an AI. I can’t make commitments for Vishal.'
        : 'I’m an AI. I can’t make commitments on Vishal’s behalf.'}
    </p>
  );
}
