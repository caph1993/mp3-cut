
function waitForElement(selector) {
  return new Promise(resolve => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }
    const observer = new MutationObserver(mutations => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}

function waitFor(callable) {
  return new Promise(resolve => {
    const repeat = setInterval(() => {
      let obj = callable();
      if (obj) {
        clearInterval(repeat);
        resolve(obj);
      }
    }, 1000);
  });

}

function sleep(ms){
  return new Promise(resolve => setTimeout(resolve, ms));
}