<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns="http://www.w3.org/1999/xhtml" xmlns:str="http://exslt.org/strings"
    xmlns:exsl="http://exslt.org/common" xmlns:set="http://exslt.org/sets"
    xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:data="http://www.pauldyck.com/data"
    xmlns:pd="http://www.pauldyck.com/" xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:jq="http://www.pauldyck.com/jquery" exclude-result-prefixes="data"
    extension-element-prefixes="exsl str set" version="1.0">

    <xsl:output method="xml" encoding="UTF-8" version="1.0" indent="yes"/>

    <xsl:template match="/">
        <pd:interpretations>
            <xsl:apply-templates select="//tei:interpGrp | //tei:interp[not(parent::tei:interpGrp)]"/>
        </pd:interpretations>
    </xsl:template>

    <xsl:template match="tei:interpGrp">
        <pd:interpGrp id="interpGrp-{@type}" text="{@type}" type="{@type}" loaded="true">
            <xsl:apply-templates select="tei:interp"/>
        </pd:interpGrp>
    </xsl:template>

    <xsl:template match="tei:interp">
        <pd:interp id="{@xml:id}" key="{@xml:id}" text="{.}" leaf="true"/>
    </xsl:template>
</xsl:stylesheet>
