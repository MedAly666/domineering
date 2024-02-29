setInterval(async () => {
  const result = await Bun.build({
    entrypoints: ['./index.ts'],
    outdir: './public',
    watch: true,
  });
}, 1000);

