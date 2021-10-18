function fixArabicText(text) {
    const arabicRegex = /[\u0600-\u06FF]/;
    // create lines by splitting using \n regex
    let lines = text.trim().split(/\n/g);

    // map over the lines and return a new line re-arranged words that take into account arabic and english mix
    lines = lines.map((line, index) => {
        let words = line
            .split(/(\s+)/)
            .filter((word) => word.trim().length > 0);
        let newWords = [];
        // this will indicate whether we reverse the words or not
        let startsWithArabic = false;
        if (words.length > 0) {
            // we assign all arabic words to iArabic before we encounter an english word
            //for example (انا عايز اشتري fan) in which case (iArabic = "انا عايز اشتري") and will be treated as one element of the array
            let iArabic = "";
            // we assign all other words to iElse before we encounter an arabic word
            //for example (I want to buy a مروحة) in which case (iElse = "I want to buy a") and will be treated as one element of the array
            let iElse = "";
            startsWithArabic = words[0];
            // what happens here is that we keep concatenating words of arabic that are following each other into iArabic but we don't push into the array
            // however, we check if iElse length is > 0, in which case, we need to push the iElse content as the next element in the array
            // we then do the same for iElse, we keep concatenating words of other languages that are following each other into iElse, but we don't push into the array
            // the idea is that we take a sentance like this (Mohamed Badawy كان عايز يجيب fan للكمبيوتر بتاعه) and in the first two iterations we will assign "Mohamed" and then "Badawy"
            // into iElse, then we will encounter "كان عايز تجيب" which in the next 3 iterations the 3 words will be concatenated into iArabic
            // at first, we will push iElse in the array and it will look like this ["Mohamed Badawy"]
            // after we assign iArabic "كان عايز يجيب" we will encounter the word "fan", in which case it will be assigned to iElse
            // and in this instance we will push the iArabic to the array, and it will look like ["Mohamed Badawy", "كان عايز يجيب"]
            // and so on until we have an array that looks like this ["Mohamed Badawy", "كان عايز يجيب", "fan", "للكمبيوتر بتاعه"], and so when we do a reverse
            // the words won't be messed up and look like this "بتاعه للكمبيوتر fan يجيب عايز كان Badawy Mohamed" as the reversed parts of the sentance are the ones following different language
            for (let i = 0; i < words.length; i++) {
                if (arabicRegex.test(words[i])) {
                    iArabic = `${iArabic} ${words[i]}`;
                    if (iElse.length > 0) {
                        newWords.push(iElse);
                        iElse = "";
                    }
                } else {
                    if (iArabic.length > 0) {
                        newWords.push(iArabic);
                        iArabic = "";
                    }
                    iElse = `${iElse} ${words[i]}`;
                }
            }
            if (iArabic.trim().length > 0) {
                newWords.push(iArabic);
            } else if (iElse.trim().length > 0) {
                newWords.push(iElse);
            }
        }

        return startsWithArabic
            ? newWords.join(" ")
            : newWords.reverse().join(" ");
    });

    return lines.join("\n");
}

var contextMenuItem = {
    "id": "FixArabicText",
    "title": "Fix text",
    "contexts": ["selection"]
}

chrome.contextMenus.create(contextMenuItem);

chrome.contextMenus.onClicked.addListener(async function (clickData) {
    let tab = await getCurrentTab();
    if (clickData.menuItemId == "FixArabicText" && clickData.selectionText) {
        if (clickData.editable) {
            replaceText(fixArabicText(clickData.selectionText), tab.id);
        } else {
            copyToClipboard(fixArabicText(clickData.selectionText), tab.id);
        }
    }
});

async function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

function replaceText(str, tabId) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: replaceSelectedText,
        args: [str],
    });
}

function copyToClipboard(str, tabId) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: copyText,
        args: [str],
    });
};


function copyText(str) {
    const el = document.createElement('textarea');
    el.value = str;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    el.setSelectionRange(0, 99999); /* For mobile devices */
    /* Copy the text inside the text field */
    navigator.clipboard.writeText(el.value);
    document.body.removeChild(el);
    alert("Copied to clipboard");
}

function replaceSelectedText(replacementText) {
    var sel, range;
    if (window.getSelection) {
        sel = window.getSelection();
        if (sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(replacementText));
        }
    } else if (document.selection && document.selection.createRange) {
        range = document.selection.createRange();
        range.text = replacementText;
    }
}