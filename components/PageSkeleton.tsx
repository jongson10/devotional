export default function PageSkeleton() {
  return (
    <div style={{ padding: "26px 18px" }} aria-busy="true">
      <div className="skel" style={{ display: "block", width: 110, height: 12, marginBottom: 14 }} />
      <div className="skel" style={{ display: "block", width: "55%", height: 26, marginBottom: 26 }} />
      {[0, 1, 2].map((i) => (
        <div key={i} className="skel" style={{ display: "block", height: 64, borderRadius: 14, marginBottom: 12 }} />
      ))}
    </div>
  );
}
