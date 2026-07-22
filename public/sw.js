self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : { title: "DealChef", body: "A watched item is on special." };
  event.waitUntil(self.registration.showNotification(payload.title || "DealChef", { body: payload.body || "A watched item is on special.", icon: "/favicon.svg" }));
});
