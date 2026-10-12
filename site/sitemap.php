<?php
// Automatic sitemap: /sitemap.xml is rewritten here (.htaccess).
// Static pages come from sitemap.xml (edit that file for new pages); its product entries
// are replaced by the store's active products, read from Supabase with the public anon key
// (same access as the shop page). If Supabase can't be reached, sitemap.xml is served as is.
header('Content-Type: application/xml; charset=UTF-8');
header('Cache-Control: public, max-age=3600');

$static = file_get_contents(__DIR__ . '/sitemap.xml');
$origin = 'https://infinite-box.co';
$api = 'https://ptwfidmlnuggxvqhimhe.supabase.co/rest/v1/products?select=slug,created_at&active=eq.true&order=sort.asc';
$key = 'sb_publishable_-98ePc2X1ejc_YscwxuYtw_W_7p4lVq';

function fetch_products($url, $key) {
  $headers = ['apikey: ' . $key, 'Authorization: Bearer ' . $key, 'Accept: application/json'];
  if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 6, CURLOPT_HTTPHEADER => $headers]);
    $body = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($status !== 200) return null;
  } else {
    $ctx = stream_context_create(['http' => ['header' => implode("\r\n", $headers), 'timeout' => 6]]);
    $body = @file_get_contents($url, false, $ctx);
  }
  $rows = $body === false || $body === null ? null : json_decode($body, true);
  return is_array($rows) ? $rows : null;
}

$products = fetch_products($api, $key);
if ($products === null) { echo $static; exit; }

$out = preg_replace('#\s*<url>(?:(?!</url>).)*?/product\.html\?id=.*?</url>#s', '', $static);
$blocks = '';
foreach ($products as $p) {
  if (empty($p['slug'])) continue;
  $slug = htmlspecialchars(rawurlencode($p['slug']), ENT_XML1);
  $day = substr($p['created_at'] ?? date('Y-m-d'), 0, 10);
  $en = $origin . '/product.html?id=' . $slug;
  $th = $origin . '/th/product.html?id=' . $slug;
  foreach ([$en, $th] as $loc) {
    $blocks .= "\n  <url>\n    <loc>$loc</loc>\n    <lastmod>$day</lastmod>\n"
      . "    <xhtml:link rel=\"alternate\" hreflang=\"en\" href=\"$en\"/>\n"
      . "    <xhtml:link rel=\"alternate\" hreflang=\"th\" href=\"$th\"/>\n"
      . "    <xhtml:link rel=\"alternate\" hreflang=\"x-default\" href=\"$en\"/>\n  </url>";
  }
}
echo str_replace('</urlset>', $blocks . "\n</urlset>", $out);
