<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns="http://www.pauldyck.com"
    xmlns:str="http://exslt.org/strings" xmlns:exsl="http://exslt.org/common"
    xmlns:set="http://exslt.org/sets" xmlns:xlink="http://www.w3.org/1999/xlink"
    xmlns:data="http://www.pauldyck.com/data" xmlns:pd="http://www.pauldyck.com/"
    xmlns:tei="http://www.tei-c.org/ns/1.0" xmlns:jq="http://www.pauldyck.com/jquery"
    exclude-result-prefixes="data" extension-element-prefixes="exsl str set" version="1.0">

    <xsl:import href="/xslt/common.xsl" />
    <xsl:output method="xml" encoding="UTF-8" version="1.0" indent="yes"/>

    <!-- This is the key for picking out ana's, which can be multi-valued, so we tokenize -->
    <xsl:key name="ana" match="//*[@ana]" use="str:tokenize(@ana,'# ')" />

    <xsl:template match="/">
        <interpretations>
            <xsl:apply-templates select="//tei:interp"/>
        </interpretations>
    </xsl:template>

    <xsl:template match="tei:interp">
        <interpretation key="{@xml:id}" text="{.}" total="{count(key('ana', @xml:id))}">
            <xsl:attribute name="type">
                <xsl:apply-templates select="." mode="type" />
            </xsl:attribute>
            <xsl:variable name="key" select="@xml:id" />
            <xsl:for-each select="//tei:div[not(ancestor::tei:div)]"> 
                <div title="{tei:head}" type="{@type}" count="{count(key('ana', $key)[ancestor::tei:div=current()])}">
                    <xsl:attribute name="id">
                       <xsl:apply-templates select="." mode="id" />
                    </xsl:attribute>
                    <xsl:attribute name="n">
                        <xsl:apply-templates select="." mode="n" />
                    </xsl:attribute>
                </div>
            </xsl:for-each>
            <xsl:variable name="orphans" select="count(key('ana', $key)[not(ancestor::tei:div)])" />
            <div id="" title="other" n="0" count="{$orphans}" />
        </interpretation>
    </xsl:template>
</xsl:stylesheet>
