import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#1C3550',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ color: '#C97D2E', fontSize: 18, fontWeight: 800, fontFamily: 'sans-serif' }}>
          P
        </span>
      </div>
    ),
    { ...size }
  )
}
