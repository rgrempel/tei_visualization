<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns="http://www.pauldyck.com/" xmlns:str="http://exslt.org/strings"
    xmlns:exsl="http://exslt.org/common" xmlns:set="http://exslt.org/sets" xmlns:xlink="http://www.w3.org/1999/xlink"
    xmlns:data="http://www.pauldyck.com/data" xmlns:pd="http://www.pauldyck.com/" xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:jq="http://www.pauldyck.com/jquery" exclude-result-prefixes="data" extension-element-prefixes="exsl str set" version="1.0">

    <xsl:import href="/xslt/common.xsl" />

    <xsl:output method="xml" encoding="UTF-8" version="1.0" indent="yes" />

    <xsl:template match="/">
        <terms>
            <xsl:apply-templates select="set:distinct(//tei:index[not(ancestor::tei:index)]/tei:term)">
                <xsl:sort select="." />
            </xsl:apply-templates>
        </terms>
    </xsl:template>

    <xsl:template match="tei:term">
        <xsl:variable name="key" select="concat(count(ancestor::tei:index), ':', str:concat(ancestor::tei:index/tei:term))" />
        <term text="{.}" key="{$key}" loaded="true">
            <xsl:apply-templates select="set:distinct(key('terms', $key)/parent::tei:index/tei:index/tei:term)">
                <xsl:sort select="." />
            </xsl:apply-templates>            
        </term>
    </xsl:template>
</xsl:stylesheet>
