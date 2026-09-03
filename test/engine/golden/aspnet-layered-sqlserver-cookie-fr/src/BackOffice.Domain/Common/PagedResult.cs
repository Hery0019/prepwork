namespace BackOffice.Domain.Common;

// CORE-014 : forme unique d'une réponse paginée. Les noms des propriétés donnent
// `content`, `page`, `size` et `totalElements` une fois sérialisés.
public sealed record PagedResult<T>(IReadOnlyList<T> Content, int Page, int Size, long TotalElements)
{
    /// <summary>Applique une projection en conservant la pagination.</summary>
    public PagedResult<TOther> Map<TOther>(Func<T, TOther> projection)
    {
        ArgumentNullException.ThrowIfNull(projection);
        return new PagedResult<TOther>([.. Content.Select(projection)], Page, Size, TotalElements);
    }
}
