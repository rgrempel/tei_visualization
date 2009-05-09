<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:str="http://exslt.org/strings" xmlns:exsl="http://exslt.org/common"
    xmlns:set="http://exslt.org/sets" xmlns:xlink="http://www.w3.org/1999/xlink"
    xmlns:data="http://www.pauldyck.com/data" xmlns:pd="http://www.pauldyck.com/"
    xmlns:tei="http://www.tei-c.org/ns/1.0" xmlns:jq="http://www.pauldyck.com/jquery"
    exclude-result-prefixes="data" extension-element-prefixes="exsl str set" version="1.0">

    <xsl:import href="/xslt/common.xsl"/>
    <xsl:output method="xml" encoding="UTF-8" version="1.0" indent="yes"/>

    <xsl:template match="/">
        <words>
            <div id="none" type="" n="0" head="None">
                <xsl:apply-templates
                    select="str:tokenize(//tei:text/text()[not(ancestor::tei:div)])" mode="tokenize"
                />
            </div>

            <xsl:for-each select="//tei:div[not(ancestor::tei:div)]">
                <div type="{@type}" n="{@n}" head="{string(child::head)}">
                    <xsl:attribute name="id">
                        <xsl:apply-templates select="." mode="id"/>
                    </xsl:attribute>
                    <xsl:apply-templates select="." mode="tokenize"/>
                </div>
            </xsl:for-each>
        </words>
    </xsl:template>

    <xsl:template match="*" mode="tokenize">
        <xsl:for-each select="str:tokenize(.)">
            <word>
                <xsl:value-of select="."/>
            </word>
        </xsl:for-each>
    </xsl:template>
</xsl:stylesheet>
