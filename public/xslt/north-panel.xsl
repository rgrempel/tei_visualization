<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns="http://www.w3.org/1999/xhtml" xmlns:str="http://exslt.org/strings"
    xmlns:exsl="http://exslt.org/common" xmlns:set="http://exslt.org/sets"
    xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:data="http://www.pauldyck.com/data"
    xmlns:pd="http://www.pauldyck.com/" exclude-result-prefixes="data"
    xmlns:tei="http://www.tei-c.org/ns/1.0" xmlns:jq="http://www.pauldyck.com/jquery"
    extension-element-prefixes="exsl str set" version="1.0">

    <xsl:output method="html" encoding="UTF-8" version="1.0" indent="yes"/>

    <xsl:template match="/">
        <div class="main-heading">
          <xsl:value-of select="/tei:TEI/tei:teiHeader/tei:fileDesc/tei:titleStmt/tei:title" />
        </div>
    </xsl:template>
</xsl:stylesheet>
