(function() { 
  // 1) Check if the extension is enabled from chrome.storage
  chrome.storage.local.get({ extensionEnabled: true }, (data) => {
    if (!data.extensionEnabled) {
      // If OFF, do nothing and return early.
      return;
    }

    // 2) Otherwise, run the existing code as-is:
    runExtension();
  });

  function runExtension() {
    /////////////////////////////
    // ===== 1) AMAZON CODE (Unchanged!) =====
    /////////////////////////////

    // Define the Canadian keywords (all lower-case for uniformity)
    const canadianPhrases = ["made in canada", "canadian", "canada"];
    // Define the words that should cause exclusion (case sensitive)
    const excludedPhrases = ["China", "United States", "US", "United States of America", "American", "America", "USA", "usa"];

    function containsCanadianKeyword(text) {
      const lowerText = text.toLowerCase();
      return canadianPhrases.some((phrase) => lowerText.includes(phrase));
    }

    function containsExcludedKeyword(text) {
      return excludedPhrases.some((phrase) => text.includes(phrase));
    }

    function qualifiesAsCanadian(text) {
      return containsCanadianKeyword(text) && !containsExcludedKeyword(text);
    }

    function moveToTop(item) {
      const container = document.querySelector("div.s-main-slot");
      if (container && item.parentElement === container) {
        container.prepend(item);
      }
    }

    function addCanadianBadge(item) {
      if (item.dataset.badgeAdded === "true") return;
      item.dataset.badgeAdded = "true";

      const badge = document.createElement("div");
      badge.textContent = "🇨🇦 Canadian Product";
      badge.style.backgroundColor = "#ff0000";
      badge.style.color = "#ffffff";
      badge.style.padding = "4px 6px";
      badge.style.margin = "4px 0";
      badge.style.fontWeight = "bold";
      badge.style.fontSize = "12px";
      badge.style.borderRadius = "4px";
      badge.style.display = "inline-block";

      let titleElem = item.querySelector("h2, .a-text-normal");
      if (titleElem) {
        titleElem.insertAdjacentElement("beforebegin", badge);
      } else {
        item.insertAdjacentElement("afterbegin", badge);
      }
    }

    async function checkProductDetails(item) {
      if (item.dataset.detailChecked === "true") return;
      item.dataset.detailChecked = "true";

      let productLink = item.querySelector("a[href*='/dp/']");
      if (!productLink) {
        if (qualifiesAsCanadian(item.innerText || "")) {
          addCanadianBadge(item);
          moveToTop(item);
        }
        return;
      }

      let url = productLink.href;
      if (url.startsWith("/")) {
        url = window.location.origin + url;
      }

      try {
        const response = await fetch(url);
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");

        let productInfoText = "";
        const techDetails = doc.querySelector("#productDetails_techSpec_section_1");
        if (techDetails) productInfoText += techDetails.innerText;
        const additionalDetails = doc.querySelector("#productDetails_detailBullets_sections1");
        if (additionalDetails) productInfoText += additionalDetails.innerText;
        const detailBullets = doc.querySelector("#detailBullets_feature_div");
        if (detailBullets) productInfoText += detailBullets.innerText;

        if (qualifiesAsCanadian(productInfoText)) {
          addCanadianBadge(item);
          moveToTop(item);
        }
      } catch (error) {
        if (qualifiesAsCanadian(item.innerText || "")) {
          addCanadianBadge(item);
          moveToTop(item);
        }
      }
    }

    function filterProducts() {
      const items = document.querySelectorAll(".s-result-item");
      items.forEach((item) => {
        checkProductDetails(item);
      });
    }

    function autoScroll() {
      let lastHeight = document.body.scrollHeight;
      const scrollInterval = setInterval(() => {
        window.scrollTo(0, document.body.scrollHeight);
        setTimeout(() => {
          let newHeight = document.body.scrollHeight;
          if (newHeight === lastHeight) {
            clearInterval(scrollInterval);
          } else {
            lastHeight = newHeight;
          }
        }, 1000);
      }, 2000);
    }

    document.addEventListener("DOMContentLoaded", () => {
      filterProducts();
      autoScroll();
    });

    const observer = new MutationObserver(() => {
      filterProducts();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    /////////////////////////////
    // ===== 2) DICTIONARY-BASED REDIRECT =====
    /////////////////////////////

    // (A) Define your dictionary
    const siteDictionary = [
      {
        domainPattern: "heinz.com",
        alternatives: [
          { name: "MapleLeafFoods", url: "https://www.mapleleaffoods.com/" },
          { name: "PresidentsChoice", url: "https://www.loblaws.ca/en" },
          { name: "EDSmith", url: "https://edsmith.com/" },
          { name: "BiscuitLeclerc", url: "https://leclerc.ca/en" },
        ]
      },
      {
        domainPattern: "kraftheinzcompany.com",
        alternatives: [
          { name: "PresidentsChoice", url: "https://www.loblaws.ca/en" },
          { name: "MapleLeafFoods", url: "https://www.mapleleaffoods.com/" },
          { name: "EDSmith", url: "https://edsmith.com/" },
          { name: "BiscuitLeclerc", url: "https://leclerc.ca/en" },
        ]
      },
      {
        domainPattern: "generalmills.com",
        alternatives: [
          { name: "NaturesPath", url: "https://naturespath.com/en-ca" },
          { name: "BiscuitLeclerc", url: "https://leclerc.ca/en" },
          { name: "PresidentsChoice", url: "https://www.loblaws.ca/en" },
          { name: "CoveredBridge", url: "https://coveredbridgechips.com/en/" },
        ]
      },
      {
        domainPattern: "hormelfoods.com",
        alternatives: [
          { name: "HarvestMeats", url: "https://harvestmeats.ca/" },
          { name: "MapleLeafFoods", url: "https://www.mapleleaffoods.com/" },
          { name: "PresidentsChoice", url: "https://www.loblaws.ca/en" },
          { name: "NoName", url: "https://www.loblaws.ca/en" },
        ]
      },
      {
        domainPattern: "conagrabrands.com",
        alternatives: [
          { name: "PresidentsChoice", url: "https://www.loblaws.ca/en" },
          { name: "NoName", url: "https://www.loblaws.ca/en" },
          { name: "NaturesPath", url: "https://naturespath.com/en-ca" },
          { name: "CoveredBridge", url: "https://coveredbridgechips.com/en/" },
        ]
      },
      {
        domainPattern: "jmsmucker.com",
        alternatives: [
          { name: "EDSmith", url: "https://edsmith.com/" },
          { name: "PresidentsChoice", url: "https://www.loblaws.ca/en" },
          { name: "NoName", url: "https://www.loblaws.ca/en" },
        ]
      },
      {
        domainPattern: "kelloggs.com",
        alternatives: [
          { name: "NaturesPath", url: "https://naturespath.com/en-ca" },
          { name: "PresidentsChoice", url: "https://www.loblaws.ca/en" },
          { name: "NoName", url: "https://www.loblaws.ca/en" },
          { name: "BiscuitLeclerc", url: "https://leclerc.ca/en" },
        ]
      },
      {
        domainPattern: "pepsico.com",
        alternatives: [
          { name: "Lassonde", url: "https://www.lassonde.com/en/" },
          { name: "CoveredBridge", url: "https://coveredbridgechips.com/en/" },
          { name: "ThePopShoppe", url: "https://www.thepopshoppe.com/" },
          { name: "PresidentsChoice", url: "https://www.loblaws.ca/en" },
          { name: "NoName", url: "https://www.loblaws.ca/en" },
        ]
      },
      {
        domainPattern: "mars.com",
        alternatives: [
          { name: "PurdysChocolatier", url: "https://www.purdys.com/" },
          { name: "LauraSecord", url: "https://laurasecord.ca/" },
          { name: "ChocolatFavoris", url: "https://www.chocolatsfavoris.com/en" },
        ]
      },
      {
        domainPattern: "pg.ca",
        alternatives: [
          { name: "TheGreenBeaverCompany", url: "https://greenbeaver.com/" },
          { name: "RockyMountainSoapCo", url: "https://www.rockymountainsoap.com/" },
          { name: "LiseWatier", url: "https://watier.com/en" },
          { name: "BKindCosmetics", url: "https://bkind.com/" },
        ]
      },
      {
        domainPattern: "jnj.com",
        alternatives: [
          { name: "LifeBrand", url: "https://www.shoppersdrugmart.ca/shop/life-brand/c/LB" },
          { name: "ATTITUDE", url: "https://attitudeliving.com/" },
          { name: "TheGreenBeaverCompany", url: "https://greenbeaver.com/" },
          { name: "RockyMountainSoapCo", url: "https://www.rockymountainsoap.com/" },
        ]
      },
      {
        domainPattern: "walgreens.com",
        alternatives: [
          { name: "ShoppersDrugMart", url: "https://www.shoppersdrugmart.ca/" },
          { name: "Rexall", url: "https://www.rexall.ca/" },
          { name: "Familiprix", url: "https://www.familiprix.com/" },
          { name: "LondonDrugs", url: "https://www.londondrugs.com/" },
        ]
      },
      {
        domainPattern: "colgate.com",
        alternatives: [
          { name: "ATTITUDE", url: "https://attitudeliving.com/" },
          { name: "TheGreenBeaverCompany", url: "https://greenbeaver.com/" },
          { name: "RockyMountainSoapCo", url: "https://www.rockymountainsoap.com/" },
          { name: "BKindCosmetics", url: "https://bkind.com/" },
        ]
      },
      {
        domainPattern: "clorox.com",
        alternatives: [
          { name: "PinkSolution", url: "https://store.pinksolution.ca/" },
          { name: "LavoInc", url: "https://www.lavo.ca/en/" },
          { name: "ATTITUDE", url: "https://attitudeliving.com/" },
          { name: "Sapadilla", url: "https://ca.iherb.com/c/sapadilla" },
        ]
      },
      {
        domainPattern: "scjohnson.com",
        alternatives: [
          { name: "Sapadilla", url: "https://ca.iherb.com/c/sapadilla" },
          { name: "LavoInc", url: "https://www.lavo.ca/en/" },
          { name: "ATTITUDE", url: "https://attitudeliving.com/" },
          { name: "PinkSolution", url: "https://store.pinksolution.ca/" },
        ]
      },
      {
        domainPattern: "levistrauss.com",
        alternatives: [
          { name: "DishNDuer", url: "https://shopduer.com/" },
          { name: "Kotn", url: "https://kotn.com/" },
          { name: "Rudsak", url: "https://rudsak.com/" },
          { name: "Tentree", url: "https://www.tentree.com/" },
        ]
      },
      {
        domainPattern: "gapinc.com",
        alternatives: [
          { name: "Kotn", url: "https://kotn.com/" },
          { name: "Reitmans", url: "https://www.reitmans.com/" },
          { name: "Lululemon", url: "https://shop.lululemon.com/en-ca/" },
        ]
      },
      {
        domainPattern: "nike.com",
        alternatives: [
          { name: "Lululemon", url: "https://shop.lululemon.com/en-ca/" },
          { name: "Arcteryx", url: "https://arcteryx.com/us/en" },
          { name: "Reitmans", url: "https://www.reitmans.com/" },
          { name: "SportCheck", url: "https://www.sportchek.ca/en.html" },
        ]
      },
      {
        domainPattern: "timberland.ca",
        alternatives: [
          { name: "CanadaWestBoots", url: "https://www.canadawestboots.com/" },
          { name: "Rudsak", url: "https://rudsak.com/" },
        ]
      },
      {
        domainPattern: "patagonia.ca",
        alternatives: [
          { name: "Arcteryx", url: "https://arcteryx.com/us/en" },
          { name: "CanadaGoose", url: "https://www.canadagoose.com/ca/en/home-page" },
          { name: "Rudsak", url: "https://rudsak.com/" },
          { name: "Lululemon", url: "https://shop.lululemon.com/en-ca/" },
        ]
      },
      {
        domainPattern: "americanapparel.com",
        alternatives: [
          { name: "Tentree", url: "https://www.tentree.com/" },
          { name: "Kotn", url: "https://kotn.com/" },
          { name: "Lululemon", url: "https://shop.lululemon.com/en-ca/" },
          { name: "Reitmans", url: "https://www.reitmans.com/" },
        ]
      },
      {
        domainPattern: "openai.com",
        alternatives: [
          { name: "Cohere", url: "https://cohere.com/" },
          { name: "OpenText", url: "https://www.opentext.com/" },
        ]
      },
      {
        domainPattern: "chatgpt.com",
        alternatives: [
          { name: "Cohere", url: "https://cohere.com/" },
          { name: "OpenText", url: "https://www.opentext.com/" },
        ]
      },
      {
        domainPattern: "apple.com",
        alternatives: [
          { name: "CanadaComputers", url: "https://www.canadacomputers.com/en/" },
          { name: "MemoryExpress", url: "https://www.memoryexpress.com/" },
        ]
      },
      {
        domainPattern: "dell.com",
        alternatives: [
          { name: "CanadaComputers", url: "https://www.canadacomputers.com/en/" },
          { name: "MemoryExpress", url: "https://www.memoryexpress.com/" },
        ]
      },
      {
        domainPattern: "hp.com",
        alternatives: [
          { name: "CanadaComputers", url: "https://www.canadacomputers.com/en/" },
          { name: "MemoryExpress", url: "https://www.memoryexpress.com/" },
        ]
      },
      {
        domainPattern: "oreillyauto.com",
        alternatives: [
          { name: "PartSource", url: "https://partsource.ca/" },
          { name: "CanadianTire", url: "https://www.canadiantire.ca/en.html" },
          { name: "MagnaInternational", url: "https://www.magna.com/" },
          { name: "Linamar", url: "https://www.linamar.com/" },
          { name: "Martinrea", url: "https://www.martinrea.com/" },
        ]
      },
      {
        domainPattern: "autozone.com",
        alternatives: [
          { name: "PartSource", url: "https://partsource.ca/" },
          { name: "CanadianTire", url: "https://www.canadiantire.ca/en.html" },
          { name: "MagnaInternational", url: "https://www.magna.com/" },
          { name: "Linamar", url: "https://www.linamar.com/" },
          { name: "Martinrea", url: "https://www.martinrea.com/" },
        ]
      },
      {
        domainPattern: "gm.com",
        alternatives: [
          { name: "MagnaInternational", url: "https://www.magna.com/" },
          { name: "Linamar", url: "https://www.linamar.com/" },
          { name: "Martinrea", url: "https://www.martinrea.com/" },
        ]
      },
      {
        domainPattern: "stellantis.com",
        alternatives: [
          { name: "MagnaInternational", url: "https://www.magna.com/" },
          { name: "Linamar", url: "https://www.linamar.com/" },
          { name: "Martinrea", url: "https://www.martinrea.com/" },
        ]
      },
      {
        domainPattern: "ford.com",
        alternatives: [
          { name: "MagnaInternational", url: "https://www.magna.com/" },
          { name: "Linamar", url: "https://www.linamar.com/" },
          { name: "Martinrea", url: "https://www.martinrea.com/" },
        ]
      },
      {
        domainPattern: "tesla.com",
        alternatives: [
          { name: "MagnaInternational", url: "https://www.magna.com/" },
          { name: "Linamar", url: "https://www.linamar.com/" },
          { name: "Martinrea", url: "https://www.martinrea.com/" },
        ]
      },
      {
        domainPattern: "walmart.com",
        alternatives: [
          { name: "Loblaw", url: "https://www.loblaws.ca/en" },
          { name: "HudsonsBay", url: "https://www.thebay.com/" },
          { name: "GiantTiger", url: "https://www.gianttiger.com/" },
          { name: "CanadianTire", url: "https://www.canadiantire.ca/en.html" },
          { name: "Sobeys", url: "https://www.sobeys.com/en/" },
        ]
      },
      {
        domainPattern: "kroger.com",
        alternatives: [
          { name: "Sobeys", url: "https://www.sobeys.com/en/" },
          { name: "Metro", url: "https://www.metro.ca/en" },
          { name: "Loblaw", url: "https://www.loblaws.ca/en" },
        ]
      },
      {
        domainPattern: "target.com",
        alternatives: [
          { name: "CanadianTire", url: "https://www.canadiantire.ca/en.html" },
          { name: "GiantTiger", url: "https://www.gianttiger.com/" },
          { name: "Loblaw", url: "https://www.loblaws.ca/en" },
        ]
      },
      {
        domainPattern: "homedepot.com",
        alternatives: [
          { name: "HomeHardware", url: "https://www.homehardware.ca/en/" },
          { name: "RONA", url: "https://www.rona.ca/en" },
          { name: "McMunnNYates", url: "https://mcmunnandyates.com/" },
        ]
      },
      {
        domainPattern: "bestbuy.ca",
        alternatives: [
          { name: "CanadaComputers", url: "https://www.canadacomputers.com/en/" },
          { name: "MemoryExpress", url: "https://www.memoryexpress.com/" },
        ]
      },
      {
        domainPattern: "costco.com",
        alternatives: [
          { name: "BulkBarn", url: "https://www.bulkbarn.ca/" },
          { name: "Loblaw", url: "https://www.loblaws.ca/en" },
        ]
      },
      {
        domainPattern: "mcdonalds.com",
        alternatives: [
          { name: "Harveys", url: "https://www.harveys.ca/en.html" },
          { name: "ANWCanada", url: "https://web.aw.ca/en/home" },
          { name: "MrSub", url: "https://mrsub.ca/" },
          { name: "PizzaPizza", url: "https://www.pizzapizza.ca/" },
          { name: "MuchoBurrito", url: "https://muchoburrito.com/" },
        ]
      },
      {
        domainPattern: "bk.com",
        alternatives: [
          { name: "ANWCanada", url: "https://web.aw.ca/en/home" },
          { name: "Harveys", url: "https://www.harveys.ca/en.html" },
          { name: "MrSub", url: "https://mrsub.ca/" },
          { name: "PizzaPizza", url: "https://www.pizzapizza.ca/" },
          { name: "MuchoBurrito", url: "https://muchoburrito.com/" },
        ]
      },
      {
        domainPattern: "starbucks.com",
        alternatives: [
          { name: "SecondCup", url: "https://secondcup.com/en/" },
          { name: "TimHortons", url: "https://www.timhortons.ca/?lang=en" },
          { name: "BlenzCoffee", url: "https://blenz.com/" },
        ]
      },
      {
        domainPattern: "wendys.com",
        alternatives: [
          { name: "Harveys", url: "https://www.harveys.ca/en.html" },
          { name: "ANWCanada", url: "https://web.aw.ca/en/home" },
        ]
      },
      {
        domainPattern: "subway.com",
        alternatives: [
          { name: "MrSub", url: "https://mrsub.ca/" },
          { name: "Harveys", url: "https://www.harveys.ca/en.html" },
          { name: "ANWCanada", url: "https://web.aw.ca/en/home" },
        ]
      },
      {
        domainPattern: "pizzahut.ca",
        alternatives: [
          { name: "PizzaPizza", url: "https://www.pizzapizza.ca/" },
          { name: "Harveys", url: "https://www.harveys.ca/en.html" },
          { name: "ANWCanada", url: "https://web.aw.ca/en/home" },
        ]
      },
      {
        domainPattern: "dominos.ca",
        alternatives: [
          { name: "PizzaPizza", url: "https://www.pizzapizza.ca/" },
          { name: "Harveys", url: "https://www.harveys.ca/en.html" },
          { name: "ANWCanada", url: "https://web.aw.ca/en/home" },
        ]
      },
      {
        domainPattern: "chipotle.com",
        alternatives: [
          { name: "MuchoBurrito", url: "https://muchoburrito.com/" },
          { name: "Harveys", url: "https://www.harveys.ca/en.html" },
          { name: "ANWCanada", url: "https://web.aw.ca/en/home" },
          { name: "MrSub", url: "https://mrsub.ca/" },
          { name: "PizzaPizza", url: "https://www.pizzapizza.ca/" },
        ]
      },
      {
        domainPattern: "dunkindonuts.com",
        alternatives: [
          { name: "TimHortons", url: "https://www.timhortons.ca/?lang=en" },
          { name: "SecondCup", url: "https://secondcup.com/en/" },
          { name: "BlenzCoffee", url: "https://blenz.com/" },
          { name: "MrSub", url: "https://mrsub.ca/" },
          { name: "PizzaPizza", url: "https://www.pizzapizza.ca/" },
        ]
      },
      {
        domainPattern: "macys.com",
        alternatives: [
          { name: "LaMaisonSimons", url: "https://www.simons.ca/en" },
          { name: "HudsonsBay", url: "https://www.thebay.com/" },
          { name: "GiantTiger", url: "https://www.gianttiger.com/" },
        ]
      },
      {
        domainPattern: "nordstrom.com",
        alternatives: [
          { name: "LaMaisonSimons", url: "https://www.simons.ca/en" },
          { name: "HudsonsBay", url: "https://www.thebay.com/" },
        ]
      },
      {
        domainPattern: "kohls.com",
        alternatives: [
          { name: "GiantTiger", url: "https://www.gianttiger.com/" },
          { name: "LaMaisonSimons", url: "https://www.simons.ca/en" },
          { name: "HudsonsBay", url: "https://www.thebay.com/" },
        ]
      },
      {
        domainPattern: "marshalls.com",
        alternatives: [
          { name: "GiantTiger", url: "https://www.gianttiger.com/" },
          { name: "Bouclair", url: "https://www.bouclair.com/en/" },
          { name: "HudsonsBay", url: "https://www.thebay.com/" },
          { name: "LaMaisonSimons", url: "https://www.simons.ca/en" },
          { name: "CanadianTire", url: "https://www.canadiantire.ca/en.html" },
        ]
      },
      {
        domainPattern: "winners.ca",
        alternatives: [
          { name: "GiantTiger", url: "https://www.gianttiger.com/" },
          { name: "Bouclair", url: "https://www.bouclair.com/en/" },
          { name: "HudsonsBay", url: "https://www.thebay.com/" },
          { name: "LaMaisonSimons", url: "https://www.simons.ca/en" },
          { name: "CanadianTire", url: "https://www.canadiantire.ca/en.html" },
        ]
      },
      {
        domainPattern: "homesense.com",
        alternatives: [
          { name: "HudsonsBay", url: "https://www.thebay.com/" },
          { name: "Bouclair", url: "https://www.bouclair.com/en/" },
          { name: "LaMaisonSimons", url: "https://www.simons.ca/en" },
          { name: "CanadianTire", url: "https://www.canadiantire.ca/en.html" },
        ]
      },
      {
        domainPattern: "tjx.com",
        alternatives: [
          { name: "GiantTiger", url: "https://www.gianttiger.com/" },
          { name: "Bouclair", url: "https://www.bouclair.com/en/" },
          { name: "HudsonsBay", url: "https://www.thebay.com/" },
          { name: "LaMaisonSimons", url: "https://www.simons.ca/en" },
        ]
      },
      {
        domainPattern: "jpmorganchase.com",
        alternatives: [
          { name: "RBC", url: "https://www.rbcroyalbank.com/" },
          { name: "TD", url: "https://www.td.com/" },
          { name: "BMO", url: "https://www.bmo.com/" },
          { name: "CIBC", url: "https://us.cibc.com/" },
          { name: "Scotiabank", url: "https://www.scotiabank.com/" },
        ]
      },
      {
        domainPattern: "bankofamerica.com",
        alternatives: [
          { name: "RBC", url: "https://www.rbcroyalbank.com/" },
          { name: "TD", url: "https://www.td.com/" },
          { name: "BMO", url: "https://www.bmo.com/" },
          { name: "CIBC", url: "https://us.cibc.com/" },
          { name: "Scotiabank", url: "https://www.scotiabank.com/" },
        ]
      },
      {
        domainPattern: "wellsfargo.com",
        alternatives: [
          { name: "RBC", url: "https://www.rbcroyalbank.com/" },
          { name: "TD", url: "https://www.td.com/" },
          { name: "BMO", url: "https://www.bmo.com/" },
          { name: "CIBC", url: "https://us.cibc.com/" },
          { name: "Scotiabank", url: "https://www.scotiabank.com/" },
        ]
      },
      {
        domainPattern: "netflix.com",
        alternatives: [
          { name: "Crave", url: "https://www.crave.ca/en" },
          { name: "CBCGem", url: "https://gem.cbc.ca/" },
          { name: "SuperChannel", url: "https://superchannel.ca/" },
        ]
      },
      {
        domainPattern: "hulu.com",
        alternatives: [
          { name: "CBCGem", url: "https://gem.cbc.ca/" },
          { name: "Crave", url: "https://www.crave.ca/en" },
          { name: "SuperChannel", url: "https://superchannel.ca/" },
        ]
      },
      {
        domainPattern: "max.com",
        alternatives: [
          { name: "Crave", url: "https://www.crave.ca/en" },
          { name: "CBCGem", url: "https://gem.cbc.ca/" },
          { name: "SuperChannel", url: "https://superchannel.ca/" },
        ]
      },
      {
        domainPattern: "primevideo.com",
        alternatives: [
          { name: "Crave", url: "https://www.crave.ca/en" },
          { name: "SuperChannel", url: "https://superchannel.ca/" },
          { name: "CBCGem", url: "https://gem.cbc.ca/" },
        ]
      },
      {
        domainPattern: "disneyplus.com",
        alternatives: [
          { name: "Crave", url: "https://www.crave.ca/en" },
          { name: "CBCGem", url: "https://gem.cbc.ca/" },
          { name: "SuperChannel", url: "https://superchannel.ca/" },
        ]
      },
      {
        domainPattern: "jimbeam.com",
        alternatives: [
          { name: "CanadianClub", url: "https://www.canadianclub.com/en-ca/" },
          { name: "AlbertaDistillers", url: "https://www.albertadistillers.com/" },
          { name: "Molson", url: "https://www.molsoncoors.com/" },
          { name: "Moosehead", url: "https://moosehead.ca/" },
        ]
      },
      {
        domainPattern: "jackdaniels.com",
        alternatives: [
          { name: "AlbertaDistillers", url: "https://www.albertadistillers.com/" },
          { name: "CanadianClub", url: "https://www.canadianclub.com/en-ca/" },
          { name: "Moosehead", url: "https://moosehead.ca/" },
          { name: "Molson", url: "https://www.molsoncoors.com/" },
        ]
      },
      {
        domainPattern: "coors.com",
        alternatives: [
          { name: "Molson", url: "https://www.molsoncoors.com/" },
          { name: "Moosehead", url: "https://moosehead.ca/" },
          { name: "CanadianClub", url: "https://www.canadianclub.com/en-ca/" },
          { name: "AlbertaDistillers", url: "https://www.albertadistillers.com/" },
        ]
      },
      {
        domainPattern: "budweiser.com",
        alternatives: [
          { name: "Moosehead", url: "https://moosehead.ca/" },
          { name: "Molson", url: "https://www.molsoncoors.com/" },
          { name: "AlbertaDistillers", url: "https://www.albertadistillers.com/" },
          { name: "CanadianClub", url: "https://www.canadianclub.com/en-ca/" },
        ]
      },
      {
        domainPattern: "coca-cola.com",
        alternatives: [
          { name: "ThePopShoppe", url: "https://www.thepopshoppe.com/" },
        ]
      },
      {
        domainPattern: "chevron.com",
        alternatives: [
          { name: "Petro-Canada", url: "https://www.petro-canada.ca/" },
          { name: "Husky", url: "https://www.myhusky.ca/" },
          { name: "IrvingOil", url: "https://www.irvingoil.com/en-US" },
          { name: "Ultramar", url: "https://www.ultramar.ca/en/" },
        ]
      },
      {
        domainPattern: "esso.ca",
        alternatives: [
          { name: "Co-opGas", url: "https://www.fuel.crs/" },
          { name: "Petro-Canada", url: "https://www.petro-canada.ca/" },
          { name: "IrvingOil", url: "https://www.irvingoil.com/en-US" },
          { name: "Husky", url: "https://www.myhusky.ca/" },
        ]
      },
      {
        domainPattern: "phillips66.com",
        alternatives: [
          { name: "Co-opGas", url: "https://www.fuel.crs/" },
          { name: "Petro-Canada", url: "https://www.petro-canada.ca/" },
          { name: "IrvingOil", url: "https://www.irvingoil.com/en-US" },
          { name: "Husky", url: "https://www.myhusky.ca/" },
        ]
      },
      {
        domainPattern: "conoco.com",
        alternatives: [
          { name: "IrvingOil", url: "https://www.irvingoil.com/en-US" },
          { name: "Petro-Canada", url: "https://www.petro-canada.ca/" },
          { name: "Co-opGas", url: "https://www.fuel.crs/" },
          { name: "Ultramar", url: "https://www.ultramar.ca/en/" },
        ]
      },
      {
        domainPattern: "marathonpetroleum.com",
        alternatives: [
          { name: "Ultramar", url: "https://www.ultramar.ca/en/" },
          { name: "Petro-Canada", url: "https://www.petro-canada.ca/" },
          { name: "Co-opGas", url: "https://www.fuel.crs/" },
          { name: "Ultramar", url: "https://www.ultramar.ca/en/" },
        ]
      },
      {
        domainPattern: "mobil.com",
        alternatives: [
          { name: "Co-opGas", url: "https://www.fuel.crs/" },
          { name: "Petro-Canada", url: "https://www.petro-canada.ca/" },
          { name: "IrvingOil", url: "https://www.irvingoil.com/en-US" },
          { name: "Husky", url: "https://www.myhusky.ca/" },
        ]
      },
      {
        domainPattern: "lowes.com",
        alternatives: [
          { name: "HomeHardware", url: "https://www.homehardware.ca/en/" },
          { name: "McMunnNYates", url: "https://mcmunnandyates.com/" },
          { name: "RONA", url: "https://www.rona.ca/en" },
        ]
      },
      {
        domainPattern: "7-eleven.com",
        alternatives: [
          { name: "Couche-Tard", url: "https://corporate.couche-tard.com/" },
        ]
      },
      {
        domainPattern: "lyft.com",
        alternatives: [
          { name: "TappCar", url: "https://www.tappcar.ca/" },
          { name: "HOVR", url: "https://www.ridehovr.com/" },
        ]
      },
      {
        domainPattern: "ubereats.com",
        alternatives: [
          { name: "SkipTheDishes", url: "https://www.skipthedishes.com/" },
        ]
      },
      {
        domainPattern: "uber.com",
        alternatives: [
          { name: "TappCar", url: "https://www.tappcar.ca/" },
          { name: "SkipTheDishes", url: "https://www.skipthedishes.com/" },
        ]
      },
      {
        domainPattern: "ubereats.com",
        alternatives: [
          { name: "SkipTheDishes", url: "https://www.skipthedishes.com/" },
        ]
      },
      {
        domainPattern: "ebay.com",
        alternatives: [
          { name: "Kijiji", url: "https://www.kijiji.ca/" },
          { name: "LesPAC", url: "https://www.lespac.com/" },
          { name: "VarageSale", url: "https://www.varagesale.com/" },
        ]
      },
      {
        domainPattern: "amazon.com",
        alternatives: [
          { name: "CanadianTire", url: "https://www.canadiantire.ca/en.html" },
          { name: "HudsonsBay", url: "https://www.thebay.com/" },
          { name: "LaMaisonSimons", url: "https://www.simons.ca/en" },
          { name: "GiantTiger", url: "https://www.gianttiger.com/" },
        ]
      },
      {
        domainPattern: "newegg.ca",
        alternatives: [
          { name: "CanadaComputers", url: "https://www.canadacomputers.com/en/" },
          { name: "MemoryExpress", url: "https://www.memoryexpress.com/" },
        ]
      },
      {
        domainPattern: "expedia.ca",
        alternatives: [
          { name: "RedTag", url: "https://www.redtag.ca/" },
          { name: "AirCanada", url: "https://www.aircanada.com" },
          { name: "WestJet", url: "https://www.westjet.com" },
          { name: "AirTransat", url: "https://www.airtransat.com" },
          { name: "Porter", url: "https://www.flyporter.com" },
        ]
      },
      {
        domainPattern: "aa.com",
        alternatives: [
          { name: "AirCanada", url: "https://www.aircanada.com" },
          { name: "WestJet", url: "https://www.westjet.com" },
          { name: "Porter", url: "https://www.flyporter.com" },
          { name: "AirTransat", url: "https://www.airtransat.com" },
          { name: "RedTag", url: "https://www.redtag.ca/" },
        ]
      },
      {
        domainPattern: "delta.com",
        alternatives: [
          { name: "AirCanada", url: "https://www.aircanada.com" },
          { name: "WestJet", url: "https://www.westjet.com" },
          { name: "Porter", url: "https://www.flyporter.com" },
          { name: "AirTransat", url: "https://www.airtransat.com" },
          { name: "RedTag", url: "https://www.redtag.ca/" },
        ]
      },
      {
        domainPattern: "united.com",
        alternatives: [
          { name: "AirCanada", url: "https://www.aircanada.com" },
          { name: "WestJet", url: "https://www.westjet.com" },
          { name: "Porter", url: "https://www.flyporter.com" },
          { name: "AirTransat", url: "https://www.airtransat.com" },
          { name: "RedTag", url: "https://www.redtag.ca/" },
        ]
      },
      {
        domainPattern: "alaskaair.com",
        alternatives: [
          { name: "AirCanada", url: "https://www.aircanada.com" },
          { name: "WestJet", url: "https://www.westjet.com" },
          { name: "Porter", url: "https://www.flyporter.com" },
          { name: "AirTransat", url: "https://www.airtransat.com" },
          { name: "RedTag", url: "https://www.redtag.ca/" },
        ]
      },
      {
        domainPattern: "jetblue.com",
        alternatives: [
          { name: "AirCanada", url: "https://www.aircanada.com" },
          { name: "WestJet", url: "https://www.westjet.com" },
          { name: "Porter", url: "https://www.flyporter.com" },
          { name: "AirTransat", url: "https://www.airtransat.com" },
          { name: "RedTag", url: "https://www.redtag.ca/" },
        ]
      },
      {
        domainPattern: "southwest.com",
        alternatives: [
          { name: "AirCanada", url: "https://www.aircanada.com" },
          { name: "WestJet", url: "https://www.westjet.com" },
          { name: "Porter", url: "https://www.flyporter.com" },
          { name: "AirTransat", url: "https://www.airtransat.com" },
          { name: "RedTag", url: "https://www.redtag.ca/" },
        ]
      },
      {
        domainPattern: "spirit.com",
        alternatives: [
          { name: "AirCanada", url: "https://www.aircanada.com" },
          { name: "WestJet", url: "https://www.westjet.com" },
          { name: "Porter", url: "https://www.flyporter.com" },
          { name: "AirTransat", url: "https://www.airtransat.com" },
          { name: "RedTag", url: "https://www.redtag.ca/" },
        ]
      },
      {
        domainPattern: "flyfrontier.com",
        alternatives: [
          { name: "AirCanada", url: "https://www.aircanada.com" },
          { name: "WestJet", url: "https://www.westjet.com" },
          { name: "Porter", url: "https://www.flyporter.com" },
          { name: "AirTransat", url: "https://www.airtransat.com" },
          { name: "RedTag", url: "https://www.redtag.ca/" },
        ]
      },
      {
        domainPattern: "hawaiianairlines.com",
        alternatives: [
          { name: "AirCanada", url: "https://www.aircanada.com" },
          { name: "WestJet", url: "https://www.westjet.com" },
          { name: "Porter", url: "https://www.flyporter.com" },
          { name: "AirTransat", url: "https://www.airtransat.com" },
          { name: "RedTag", url: "https://www.redtag.ca/" },
        ]
      },
      {
        domainPattern: "allegiantair.com",
        alternatives: [
          { name: "AirCanada", url: "https://www.aircanada.com" },
          { name: "WestJet", url: "https://www.westjet.com" },
          { name: "Porter", url: "https://www.flyporter.com" },
          { name: "AirTransat", url: "https://www.airtransat.com" },
          { name: "RedTag", url: "https://www.redtag.ca/" },
        ]
      },
      {
        domainPattern: "whirlpool.ca*",
        alternatives: [
          { name: "CanadianApplianceStore", url: "https://www.canadianappliance.ca/" },
          { name: "CaplansAppliances", url: "https://caplans.ca/" },
          { name: "ApplianceCanada", url: "https://www.appliancecanada.com/" },
          { name: "DanbyAppliances", url: "https://www.danby.com/" },
        ]
      },
      {
        domainPattern: "geappliances.ca*",
        alternatives: [
          { name: "CanadianApplianceStore", url: "https://www.canadianappliance.ca/" },
          { name: "CaplansAppliances", url: "https://caplans.ca/" },
          { name: "ApplianceCanada", url: "https://www.appliancecanada.com/" },
          { name: "DanbyAppliances", url: "https://www.danby.com/" },
        ]
      },
      {
        domainPattern: "hamiltonbeach.ca*",
        alternatives: [
          { name: "CanadianApplianceStore", url: "https://www.canadianappliance.ca/" },
          { name: "CaplansAppliances", url: "https://caplans.ca/" },
          { name: "ApplianceCanada", url: "https://www.appliancecanada.com/" },
          { name: "DanbyAppliances", url: "https://www.danby.com/" },
        ]
      },
      {
        domainPattern: "kenmore.com*",
        alternatives: [
          { name: "CanadianApplianceStore", url: "https://www.canadianappliance.ca/" },
          { name: "CaplansAppliances", url: "https://caplans.ca/" },
          { name: "ApplianceCanada", url: "https://www.appliancecanada.com/" },
          { name: "DanbyAppliances", url: "https://www.danby.com/" },
        ]
      }
    ];

    // (B) Manage disabled domains in chrome.storage.local
    const siteDisableManager = {
      isDisabled(domainPattern, callback) {
        chrome.storage.local.get({ disablePopupDomains: {} }, (data) => {
          const disabledObj = data.disablePopupDomains || {};
          callback(disabledObj[domainPattern] === true);
        });
      },
      disable(domainPattern) {
        chrome.storage.local.get({ disablePopupDomains: {} }, (data) => {
          const disabledObj = data.disablePopupDomains || {};
          disabledObj[domainPattern] = true;
          chrome.storage.local.set({ disablePopupDomains: disabledObj });
        });
      }
    };

    // (C) Popup for site-based redirect
    function createRedirectPopupForSite(popupId, alternatives, domainPattern) {
      const popup = document.createElement("div");
      popup.id = popupId;
      popup.style.position = "fixed";
      popup.style.top = "10px";
      popup.style.right = "10px";
      popup.style.width = "320px";
      popup.style.backgroundColor = "#fff";
      popup.style.border = "2px solid #ff0000";
      popup.style.padding = "15px";
      popup.style.zIndex = "9999";
      popup.style.boxShadow = "0px 0px 10px rgba(0,0,0,0.5)";
      popup.style.fontFamily = "Arial, sans-serif";
      popup.style.borderRadius = "8px";

      const closeBtn = document.createElement("span");
      closeBtn.textContent = "×";
      closeBtn.style.position = "absolute";
      closeBtn.style.top = "5px";
      closeBtn.style.right = "8px";
      closeBtn.style.cursor = "pointer";
      closeBtn.style.color = "#888";
      closeBtn.style.fontSize = "18px";
      closeBtn.style.fontWeight = "bold";
      closeBtn.addEventListener("click", function() {
        popup.remove();
        // User dismissed without clicking a link
        sessionStorage.setItem("popupDismissed-" + domainPattern, "true");
        document.removeEventListener("click", outsideClickListener);
      });
      popup.appendChild(closeBtn);

      const title = document.createElement("h2");
      title.textContent = "Try Shopping Canadian, Eh! 🇨🇦";
      title.style.margin = "0 0 10px 0";
      title.style.fontSize = "18px";
      title.style.color = "#ff0000";
      title.style.textAlign = "center";
      popup.appendChild(title);

      const altContainer = document.createElement("div");
      altContainer.style.display = "flex";
      altContainer.style.flexDirection = "column";
      altContainer.style.rowGap = "10px";

      // Each row is 54px tall (1.5× original),
      // one flex container for the logo, one fixed-width button on the right.
      alternatives.forEach(alt => {
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.columnGap = "10px";
        row.style.height = "54px";
        row.style.width = "100%";

        // Logo container expands to fill leftover space
        const logoContainer = document.createElement("div");
        logoContainer.style.flex = "1";          // fill remaining row space
        logoContainer.style.height = "100%";     
        logoContainer.style.display = "flex";
        logoContainer.style.alignItems = "center";
        logoContainer.style.justifyContent = "center";

        const logoImg = document.createElement("img");
        const logoFile = `${alt.name}_logo.png`;
        logoImg.src = chrome.runtime.getURL("icons/" + logoFile);
        logoImg.alt = alt.name;
        // Maximize the image within the container while preserving aspect ratio
        logoImg.style.maxWidth = "100%";
        logoImg.style.maxHeight = "100%";
        logoImg.style.objectFit = "contain";

        logoContainer.appendChild(logoImg);
        row.appendChild(logoContainer);

        // Fixed-width button on the right
        const button = document.createElement("button");
        button.textContent = "Visit Site";
        button.style.width = "120px";      // slightly wider
        button.style.height = "100%";
        button.style.backgroundColor = "#ff0000";
        button.style.color = "#fff";
        button.style.border = "none";
        button.style.cursor = "pointer";
        button.style.fontWeight = "bold";
        button.style.display = "flex";
        button.style.justifyContent = "center";
        button.style.alignItems = "center";

        button.addEventListener("click", function() {
          // User clicked => remove "dismissed" so re-show next time
          sessionStorage.removeItem("popupDismissed-" + domainPattern);
          window.location.href = alt.url;
        });
        row.appendChild(button);

        altContainer.appendChild(row);
      });

      popup.appendChild(altContainer);

      // "Disable for This Website" link at the bottom
      const disableLink = document.createElement("div");
      disableLink.textContent = "Disable for This Website";
      disableLink.style.textAlign = "center";
      disableLink.style.color = "#777";
      disableLink.style.textDecoration = "underline";
      disableLink.style.margin = "15px 0 0 0";
      disableLink.style.cursor = "pointer";
      disableLink.style.fontWeight = "bold";
      disableLink.style.fontSize = "12px";

      disableLink.addEventListener("click", function() {
        siteDisableManager.disable(domainPattern);
        popup.remove();
      });
      popup.appendChild(disableLink);

      document.body.appendChild(popup);

      function outsideClickListener(event) {
        if (!popup.contains(event.target)) {
          popup.remove();
          // User dismissed without clicking a link
          sessionStorage.setItem("popupDismissed-" + domainPattern, "true");
          document.removeEventListener("click", outsideClickListener);
        }
      }
      setTimeout(() => {
        document.addEventListener("click", outsideClickListener);
      }, 0);
    }

    function checkForSiteRedirect() {
      const currentHost = window.location.hostname;

      for (const entry of siteDictionary) {
        if (currentHost.includes(entry.domainPattern)) {
          siteDisableManager.isDisabled(entry.domainPattern, (isDomainDisabled) => {
            if (isDomainDisabled) {
              return;
            }
            const dismissedKey = "popupDismissed-" + entry.domainPattern;
            if (!sessionStorage.getItem(dismissedKey)) {
              createRedirectPopupForSite("canadian-redirect-popup", entry.alternatives, entry.domainPattern);
            }
          });
          break;
        }
      }
    }

    checkForSiteRedirect();
  }
})();
