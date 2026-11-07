import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Hr,
} from '@react-email/components';
export function CalmEmail({
  subject,
  text,
  action,
  href,
  footer,
}: {
  subject: string;
  text: string;
  action: string;
  href: string;
  footer: string;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{subject}</Preview>
      <Body style={{ background: '#FEF7F0', fontFamily: 'Arial,sans-serif', color: '#1A1917' }}>
        <Container
          style={{
            maxWidth: 520,
            padding: 32,
            margin: '24px auto',
            background: '#fff',
            borderRadius: 20,
          }}
        >
          {/* Text wordmark: Gmail and Outlook block SVG images. */}
          <Text
            style={{ fontFamily: 'Georgia,serif', fontSize: 22, fontWeight: 500, margin: '0 0 8px' }}
          >
            Mind Nexus
          </Text>
          <Heading as="h1" style={{ fontFamily: 'Georgia,serif', fontSize: 28, fontWeight: 400 }}>
            {subject}
          </Heading>
          <Text style={{ lineHeight: '24px', whiteSpace: 'pre-line' }}>{text}</Text>
          <Button
            href={href}
            style={{ background: '#842A14', color: '#fff', borderRadius: 10, padding: '12px 20px' }}
          >
            {action}
          </Button>
          <Hr style={{ borderColor: '#EDEAE4', margin: '24px 0' }} />
          <Text style={{ fontSize: 12, color: '#5A564F' }}>{footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}
