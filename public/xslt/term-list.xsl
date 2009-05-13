<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns="http://www.pauldyck.com/" xmlns:str="http://exslt.org/strings"
  xmlns:exsl="http://exslt.org/common" xmlns:set="http://exslt.org/sets" xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:data="http://www.pauldyck.com/data" xmlns:pd="http://www.pauldyck.com/" xmlns:tei="http://www.tei-c.org/ns/1.0"
  xmlns:jq="http://www.pauldyck.com/jquery" exclude-result-prefixes="data" extension-element-prefixes="exsl str set" version="1.0">

  <xsl:import href="/xslt/common.xsl" />

  <xsl:output method="xml" encoding="UTF-8" version="1.0" indent="yes" />

  <xsl:template match="/">
    <terms>
      <!-- We get each term, and then compute its key to see if it is the first occurence of its kind. If so,
           we output it. -->
      <xsl:for-each select="//tei:index/tei:term">
        <xsl:sort select="." />
        <xsl:variable name="key" select="concat(count(ancestor::tei:index), ':', str:concat(ancestor::tei:index/tei:term))" />
        <xsl:if test="generate-id(.) = generate-id(key('terms', $key))">
          <xsl:apply-templates select="." />
        </xsl:if>
      </xsl:for-each>
    </terms>
  </xsl:template>

  <xsl:template match="tei:term">
    <xsl:variable name="key" select="concat(count(ancestor::tei:index), ':', str:concat(ancestor::tei:index/tei:term))" />
    <term text="{.}" key="{$key}">
      <!-- Instead of doing the top-down hierarchy, we're flattening it and computing the parentKey -->
      <xsl:attribute name="parentKey">
        <xsl:variable name="parent" select="parent::tei:index/parent::tei:index/tei:term[1]" />
        <xsl:if test="$parent">
          <xsl:value-of select="concat(count($parent/ancestor::tei:index), ':', str:concat($parent/ancestor::tei:index/tei:term))" />
        </xsl:if>
      </xsl:attribute>
    </term>
  </xsl:template>
</xsl:stylesheet>
