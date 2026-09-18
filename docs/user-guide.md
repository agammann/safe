# Using Safe

[Open Safe](https://safe.alx21.chatgpt.site) · [Back to the README](../README.md)

Safe helps answer: **What can this WiFi see about me?** It combines a small browser connection check with privacy explanations. It does not inspect the router or other people on the network.

## Run your first check

1. Connect to the WiFi you want to use. If the network requires a sign in page, finish its normal connection process first.
2. Open Safe. On a narrow screen, use the menu button to open navigation.
3. Optionally label the check, for example `First check`. Labels are saved with reports; do not include private information.
4. Select **Check my WiFi**. The app makes three sequential HTTPS requests to Cloudflare. Each request can wait up to six seconds before timing out.
5. Read the findings. Expand **Why this matters** for an explanation, or **View the measured evidence** for details.

You can cancel a check while it is running. A cancelled check does not save a new report.

## Read a report

| Result | How to interpret it |
| --- | --- |
| HTTPS responses | How many of the three diagnostic requests returned a valid response. Three successes apply to those requests, not every app or website. |
| Encryption for the test requests | The TLS version Cloudflare reported. This relies on your browser's certificate trust. |
| Median request time | A summary of successful request durations, including browser and service overhead. It is not WiFi signal strength, bandwidth, or a speed test. |
| Connection type | What the browser reports. Unavailable is normal when the browser does not expose this information. |
| Public IP observation | The address the diagnostic destination saw. Open **Why this matters** under **The address our test destination saw**, then select **Reveal address** while it is available in memory. |
| Protection for this app's page | Whether Safe itself loaded over HTTPS. The local development and preview addresses use HTTP. |
| Unknown | Information outside this check's view. It is not a pass or a failure. |

For three successful samples, the middle duration is reported. With two successful samples, Safe reports the higher of the two; with one success, it reports that duration. With no successes, duration is unavailable. Comparisons use this same reported statistic.

## Compare checks

1. Run a check before changing anything.
2. Keep the same Safe page open. Change the connection or an existing VPN setting yourself, if that is what you want to compare. Safe does not change device settings.
3. Run another check.
4. Open **Compare checks** and choose the **Before** and **After** reports. Choose two different reports.

The timing difference is the after check's reported duration minus the before check's. Negative means the after check took less time; positive means it took more time. Timing is unavailable if either check had no successful requests. A timing difference can come from the browser, service, or internet connection and does not establish that a setting caused it.

IP comparison needs an address from both reports in the current page session. It becomes unavailable after reloading, or if an address changes within either check. Saved reports deliberately exclude addresses. A changed IP does not prove VPN coverage, and an unchanged IP does not prove that protection is absent.

## Save, export, and remove reports

Safe automatically keeps the latest 20 reports in this browser when local storage is available. **Your checks** lets you reopen a report. New reports replace the oldest when all slots are used. Reports do not follow you to another browser, device, or website address.

Use **Export report** to download a JSON file. It omits public IP addresses but retains the label and other report details. Review these before sharing. Safe does not import exported reports.

Remove an individual report in **Your checks**, or open **Privacy & data** and select **Clear saved checks**. Use **Undo** immediately if needed. Do not rely on undo after a reload, another removal, or starting a new check. Clearing browser reports does not delete previously downloaded files.

If the browser cannot save data, the app displays a notice. You can still use the current session and export a report before reloading. Stored reports are not encrypted; anyone using the same browser profile may be able to read them.

## Troubleshooting

| What you see | What to do |
| --- | --- |
| A timed out or unverified request | Check that the internet connection works and any WiFi sign in is complete, then try again. The service, browser restrictions, an extension, or the network may block the request. Failure alone does not prove interception. |
| Connection type unavailable | Continue reading the other findings. Safe cannot force a browser to reveal whether it is on WiFi, Ethernet, or mobile data. |
| IP comparison unavailable | Run two fresh checks without reloading the page. Saved addresses cannot be recovered because they are not stored. |
| Saved checks unavailable | Check whether browser storage is blocked. Export any report you need before leaving. The public and local versions have separate storage. |
| DNS or VPN findings marked Unknown | This is a limit of the check. Safe cannot verify protection across your whole device. |
| Local preview says the page is not HTTPS | Expected for the localhost URLs in the development guide. The diagnostic requests still use HTTPS. |

For an app defect, [open an issue](https://github.com/agammann/safe/issues) with the browser, device type, steps, and a fictional label. Do not include real IP addresses or an unreviewed report. See [security reporting](../SECURITY.md#reporting) for sensitive findings.

## Learn more

The **What WiFi can see** page explains content, destination names, connection metadata, and VPN tradeoffs. Its references include [EFF on encryption](https://ssd.eff.org/module/what-should-i-know-about-encryption), [EFF on VPNs](https://ssd.eff.org/module/vpn.html), [Cloudflare on Encrypted Client Hello](https://developers.cloudflare.com/ssl/edge-certificates/ech/), and [MDN on browser connection information](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation).

Cloudflare receives the diagnostic requests described before each check. See its [privacy policy](https://www.cloudflare.com/privacypolicy/) and Safe's [data handling details](../SECURITY.md).
