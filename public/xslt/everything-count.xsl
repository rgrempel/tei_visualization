<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:str="http://exslt.org/strings" xmlns:exsl="http://exslt.org/common"
    xmlns:set="http://exslt.org/sets" xmlns:xlink="http://www.w3.org/1999/xlink"
    xmlns:data="http://www.pauldyck.com/data" xmlns:pd="http://www.pauldyck.com/"
    xmlns:tei="http://www.tei-c.org/ns/1.0" xmlns:jq="http://www.pauldyck.com/jquery"
    exclude-result-prefixes="data" extension-element-prefixes="exsl str set" version="1.0">

    <xsl:import href="/xslt/common.xsl"/>
    <xsl:output method="xml" encoding="UTF-8" version="1.0" indent="yes"/>

    <xsl:key name="namesByKey" match="tei:name" use="@key"/>
    <xsl:key name="namesAndRSByKey" match="tei:name | tei:rs" use="@key"/>
    <xsl:key name="saidByWho" match="tei:said" use="@who"/>
    <xsl:key name="ana" match="//*[@ana]" use="str:tokenize(@ana,'# ')"/>

    <xsl:template match="/">
        <xsl:variable name="firstNames"
            select="//tei:name[generate-id(.) = generate-id(key('namesByKey', @key))]"/>
        <keys>
           <xsl:variable name="keys">
                <xsl:apply-templates select="$firstNames" mode="references"/>
                <xsl:apply-templates select="$firstNames" mode="dialog"/>
                <xsl:apply-templates select="//tei:interp"/>
           </xsl:variable>
           <xsl:for-each select="exsl:node-set($keys)/key">
                <xsl:sort select="@total" data-type="number" order="descending"/>
                <xsl:copy-of select="."/>
            </xsl:for-each>
        </keys>
    </xsl:template>

    <xsl:template match="tei:interp">
        <key kind="interpretation" key="{@xml:id}" total="{count(key('ana', @xml:id))}">
            <xsl:attribute name="text">
                <xsl:value-of select="."/>
                <xsl:text> (i)</xsl:text>
            </xsl:attribute>
            <xsl:attribute name="type">
                <xsl:apply-templates select="." mode="type"/>
            </xsl:attribute>
            <xsl:variable name="key" select="@xml:id"/>
            <xsl:for-each select="//tei:div[not(ancestor::tei:div)]">
                <div title="{tei:head}" type="{@type}"
                    count="{count(key('ana', $key)[ancestor::tei:div=current()])}">
                    <xsl:attribute name="id">
                        <xsl:apply-templates select="." mode="id"/>
                    </xsl:attribute>
                    <xsl:attribute name="n">
                        <xsl:apply-templates select="." mode="n"/>
                    </xsl:attribute>
                </div>
            </xsl:for-each>
            <xsl:variable name="orphans" select="count(key('ana', $key)[not(ancestor::tei:div)])"/>
            <div id="" title="other" n="0" count="{$orphans}"/>
        </key>
    </xsl:template>

    <xsl:template match="tei:name" mode="references">
        <key key="{@key}" kind="reference" type="{@type}"
            total="{count(key('namesAndRSByKey', @key))}">
            <xsl:attribute name="text">
                <xsl:apply-templates select="." mode="canonical"/>
                <xsl:text> (r)</xsl:text>
            </xsl:attribute>
            <xsl:variable name="key" select="@key"/>
            <xsl:for-each select="//tei:div[not(ancestor::tei:div)]">
                <div count="{count(key('namesAndRSByKey', $key)[ancestor::tei:div=current()])}">
                    <xsl:attribute name="id">
                        <xsl:apply-templates select="." mode="id"/>
                    </xsl:attribute>
                    <xsl:attribute name="n">
                        <xsl:apply-templates select="." mode="n"/>
                    </xsl:attribute>
                </div>
            </xsl:for-each>
            <xsl:variable name="orphans"
                select="count(key('namesAndRSByKey', $key)[not(ancestor::tei:div)])"/>
            <div id="" title="other" n="0" count="{$orphans}"/>
        </key>
    </xsl:template>

    <xsl:template match="tei:name" mode="dialog">
        <key key="{@key}" kind="dialog" type="{@type}" total="{count(key('saidByWho', @key))}">
            <xsl:attribute name="text">
                <xsl:apply-templates select="." mode="canonical"/>
                <xsl:text> (d)</xsl:text>
            </xsl:attribute>
            <xsl:variable name="key" select="@key"/>
            <xsl:for-each select="//tei:div[not(ancestor::tei:div)]">
                <div title="{tei:head}"
                    count="{count(key('saidByWho', $key)[ancestor::tei:div=current()])}">
                    <xsl:attribute name="id">
                        <xsl:apply-templates select="." mode="id"/>
                    </xsl:attribute>
                    <xsl:attribute name="n">
                        <xsl:apply-templates select="." mode="n"/>
                    </xsl:attribute>
                </div>
            </xsl:for-each>
            <xsl:variable name="orphans"
                select="count(key('saidByWho', $key)[not(ancestor::tei:div)])"/>
            <div id="" title="other" n="0" count="{$orphans}"/>
        </key>
    </xsl:template>
</xsl:stylesheet>
