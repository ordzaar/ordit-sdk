async function main() {
  const appRoot = document.getElementById("app");

  if (!appRoot) {
    return;
  }

  appRoot.innerHTML = "Browser Test";
}

main();
