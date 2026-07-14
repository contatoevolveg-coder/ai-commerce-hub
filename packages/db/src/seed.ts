async function main() {
  console.log('Seed: Start');
  // Seed initial logic here
  console.log('Seed: Done');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
