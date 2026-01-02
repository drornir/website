<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
 xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9">

 <xsl:template match="/">
    <html>
        <head>
            <title>Sitemap</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
                    color: #333;
                    max-width: 800px;
                    margin: 2rem auto;
                    padding: 0 1rem;
                    line-height: 1.5;
                }
                h1 {
                    font-size: 2rem;
                    margin-bottom: 1rem;
                    border-bottom: 1px solid #eaeaea;
                    padding-bottom: 0.5rem;
                }
                ul {
                    list-style: none;
                    padding: 0;
                }
                li {
                    margin-bottom: 0.5rem;
                }
                a {
                    color: #0070f3;
                    text-decoration: none;
                    font-family: monospace;
                    font-size: 1.1rem;
                }
                a:hover {
                    text-decoration: underline;
                    color: #0056b3;
                }
                .sitemap-section {
                    margin-top: 2rem;
                }
            </style>
        </head>
        <body>
            <h1>drornir.dev Sitemap</h1>
            
            <xsl:if test="sm:sitemapindex/sm:sitemap">
                <div class="sitemap-section">
                    <h2>Sitemap Index</h2>
                    <ul>
                        <xsl:for-each select="sm:sitemapindex/sm:sitemap">
                            <li>
                                <a href="{sm:loc}"><xsl:value-of select="sm:loc"/></a>
                            </li>
                        </xsl:for-each>
                    </ul>
                </div>
            </xsl:if>
            
            <xsl:if test="sm:urlset/sm:url">
                <div class="sitemap-section">
                    <h2>Pages</h2>
                    <ul>
                        <xsl:for-each select="sm:urlset/sm:url">
                            <li>
                                <a href="{sm:loc}"><xsl:value-of select="sm:loc"/></a>
                            </li>
                        </xsl:for-each>
                    </ul>
                </div>
            </xsl:if>
        </body>
    </html>
 </xsl:template>
</xsl:stylesheet>
