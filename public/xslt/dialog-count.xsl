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
    <xsl:key name="saidByWho" match="tei:said" use="@who" />

    <xsl:template match="/">
        <names>
            <xsl:apply-templates select="//tei:name[generate-id(.) = generate-id(key('namesByKey', @key))]">
                <xsl:sort select="count(key('saidByWho', @key))" data-type="number" order="descending" />
            </xsl:apply-templates>
        </names>
    </xsl:template>

    <xsl:template match="tei:name">
        <name key="{@key}" type="{@type}" total="{count(key('saidByWho', @key))}">
            <xsl:attribute name="text">
                <xsl:apply-templates select="." mode="canonical" />
            </xsl:attribute>
            <xsl:variable name="key" select="@key" />
            <xsl:for-each select="//tei:div[not(ancestor::tei:div)]">
                <div title="{tei:head}" count="{count(key('saidByWho', $key)[ancestor::tei:div=current()])}">
                    <xsl:attribute name="id">
                        <xsl:apply-templates select="." mode="id" />
                    </xsl:attribute>
                    <xsl:attribute name="n">
                        <xsl:apply-templates select="." mode="n" />
                    </xsl:attribute>
                </div>
            </xsl:for-each>
            <xsl:variable name="orphans" select="count(key('saidByWho', $key)[not(ancestor::tei:div)])" />
            <div id="" title="other" n="0" count="{$orphans}" />
        </name>
    </xsl:template>
</xsl:stylesheet>
