function json(data: object) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd({ data, id }: { data: object | object[]; id?: string }) {
  const entries = Array.isArray(data) ? data : [data];
  return (
    <>
      {entries.map((entry, index) => (
        <script
          key={id ?? index}
          id={index === 0 ? id : undefined}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: json(entry) }}
        />
      ))}
    </>
  );
}
