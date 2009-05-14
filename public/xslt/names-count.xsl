<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns="http://www.pauldyck.com"
    xmlns:str="http://exslt.org/strings" xmlns:exsl="http://exslt.org/common"
    xmlns:set="http://exslt.org/sets" xmlns:xlink="http://www.w3.org/1999/xlink"
    xmlns:data="http://www.pauldyck.com/data" xmlns:pd="http://www.pauldyck.com/"
    xmlns:tei="http://www.tei-c.org/ns/1.0" xmlns:jq="http://www.pauldyck.com/jquery"
    exclude-result-prefixes="data" extension-element-prefixes="exsl str set" version="1.0">

    <xsl:import href="/xslt/common.xsl" />
    <xsl:output method="xml" encoding="UTF-8" version="1.0" indent="yes"/>

    <xsl:key name="namesByKey" match="tei:name" use="@key"/>
    <xsl:key name="namesAndRSByKey" match="tei:name | tei:rs" use="@key" />

    <xsl:template match="/">
        <keys>
            <xsl:apply-templates select="//tei:name[generate-id(.) = generate-id(key('namesByKey', @key))]">
                <xsl:sort select="count(key('namesAndRSByKey', @key))" data-type="number" order="descending" />
            </xsl:apply-templates>
        </keys>
    </xsl:template>

    <xsl:template match="tei:name">
        <key key="{@key}" type="{@type}" total="{count(key('namesAndRSByKey', @key))}">
            <xsl:attribute name="text">
                <xsl:apply-templates select="." mode="canonical" />
            </xsl:attribute>
            <xsl:variable name="key" select="@key" />
            <xsl:for-each select="//tei:div[not(ancestor::tei:div)]"> 
                <div count="{count(key('namesAndRSByKey', $key)[ancestor::tei:div=current()])}">
                    <xsl:attribute name="id">
                        <xsl:apply-templates select="." mode="id" />
                    </xsl:attribute>
                    <xsl:attribute name="n">
                        <xsl:apply-templates select="." mode="n" />
                    </xsl:attribute>
                </div>
            </xsl:for-each>
            <xsl:variable name="orphans" select="count(key('namesAndRSByKey', $key)[not(ancestor::tei:div)])" />
            <div id="" title="other" n="0" count="{$orphans}" />
        </key>
    </xsl:template>
</xsl:stylesheet>
