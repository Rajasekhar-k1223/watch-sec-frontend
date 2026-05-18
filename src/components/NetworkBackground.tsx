// NetworkBackground replaced with a lightweight pure-CSS static pattern.
// The canvas O(n²) particle simulation was causing browser tab freezing.
export default function NetworkBackground() {
    return (
        <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
                backgroundImage: `
                    radial-gradient(circle at 20% 30%, rgba(59,130,246,0.06) 0%, transparent 50%),
                    radial-gradient(circle at 80% 70%, rgba(124,58,237,0.06) 0%, transparent 50%)
                `,
                backgroundSize: '100% 100%'
            }}
        />
    );
}
